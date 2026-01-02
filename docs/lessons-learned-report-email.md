# Lessons Learned: Report Email System Implementation

This document captures key decisions, patterns, and gotchas from implementing the scheduled report email feature.

## Architecture Decisions

### 1. Database-Stored SMTP Config vs Environment Variables

**Decision**: Store SMTP credentials in `system_settings` table instead of `.env` files.

**Why**:
- Allows runtime configuration without redeployment
- Enables admin UI for non-technical users
- Supports multi-tenant scenarios where each tenant might have different SMTP settings

**Trade-off**: Requires encryption layer for password storage.

### 2. AES-256-GCM over AES-256-CBC

**Decision**: Use GCM (Galois/Counter Mode) instead of CBC for encryption.

**Why**:
- GCM provides **authenticated encryption** (integrity + confidentiality)
- Detects tampering—if ciphertext is modified, decryption fails with auth error
- CBC only provides confidentiality; tampering goes undetected

**Format**: `iv:authTag:ciphertext` (all base64-encoded)

```typescript
// GCM includes auth tag verification automatically
const decipher = createDecipheriv("aes-256-gcm", key, iv);
decipher.setAuthTag(authTag); // Fails if tampered
```

### 3. External Cron vs In-Process Scheduler

**Decision**: Use API endpoint (`/api/cron/process-reports`) triggered by external cron.

**Why**:
- Works in serverless environments (Vercel, AWS Lambda)
- No dependency on `node-cron` or long-running process
- More robust—survives server restarts
- Can be triggered by any scheduler (Linux crontab, Vercel Cron, GitHub Actions)

**Trade-off**: Requires separate cron configuration outside the app.

## Security Patterns

### Never Return Decrypted Passwords to Client

```typescript
// Bad: Returns actual password
return { password: decrypt(config.password) };

// Good: Returns existence flag only
return { hasPassword: Boolean(config.password) };
```

On edit forms, show placeholder and only update password if user provides new value.

### Protect Cron Endpoints

```typescript
const cronSecret = request.headers.get("x-cron-secret");
if (cronSecret !== process.env.CRON_SECRET) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

Without this, anyone could trigger your cron endpoint and spam emails.

### Validate Emails Before Storage AND Before Sending

```typescript
// At schedule creation time
const { valid, invalid } = validateEmails(data.recipients);
if (invalid.length > 0) {
  return { error: `Invalid emails: ${invalid.join(", ")}` };
}

// At send time (defensive)
const { valid, invalid } = validateEmails(recipients);
```

Users might have invalid emails in old schedules if validation was added later.

## Reliability Patterns

### Simple Database Locking

For preventing duplicate cron runs:

```typescript
const LOCK_KEY = "cron_process_reports_lock";
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 min timeout

async function acquireLock(): Promise<boolean> {
  const existing = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, LOCK_KEY),
  });

  if (existing) {
    const elapsed = Date.now() - new Date(existing.value.lockedAt).getTime();
    if (elapsed < LOCK_TIMEOUT_MS) return false; // Still locked
  }

  // Upsert lock
  await db.insert(systemSettings).values({
    key: LOCK_KEY,
    value: { lockedAt: new Date().toISOString() },
  }).onConflictDoUpdate(...);

  return true;
}
```

**Note**: This is "good enough" locking for low-frequency cron jobs. For high-concurrency, use Redis or database advisory locks.

### Continue on Individual Failures

```typescript
for (const schedule of dueSchedules) {
  try {
    await processSchedule(schedule);
    await markScheduleRun(schedule.id, true);
  } catch (error) {
    // Log error but DON'T break the loop
    await markScheduleRun(schedule.id, false, error.message);
    continue; // Process remaining schedules
  }
}
```

One failed email shouldn't block all others.

### Track Failure State

Added columns to `reportSchedules`:
- `lastError`: Human-readable error message
- `failedAt`: Timestamp of last failure
- `retryCount`: Number of consecutive failures

This enables:
- Showing errors in UI
- Implementing retry backoff
- Alerting on repeated failures

## Monthly Date Calculation Gotcha

```typescript
// Wrong: Adding 30 days doesn't account for month lengths
next.setDate(next.getDate() + 30);

// Correct: JavaScript handles month overflow
next.setMonth(next.getMonth() + 1);
// Jan 31 + 1 month = Feb 28/29 (auto-adjusted)
```

## Testing Approach

### Unit Tests for Pure Functions

Encryption and email validation are pure functions—easy to test:

```typescript
it("should encrypt and decrypt round-trip", () => {
  const plaintext = "secret";
  const encrypted = encrypt(plaintext);
  expect(decrypt(encrypted)).toBe(plaintext);
});

it("should detect tampered ciphertext", () => {
  const encrypted = encrypt("test");
  const [iv, auth, cipher] = encrypted.split(":");
  const tampered = `${iv}:${auth}:${Buffer.from("bad").toString("base64")}`;
  expect(() => decrypt(tampered)).toThrow();
});
```

### Integration Tests with Mock SMTP

For email sending, use nodemailer's test account:

```typescript
const testAccount = await nodemailer.createTestAccount();
// Use testAccount.smtp for host/port/auth
// Emails go to Ethereal, not real inboxes
```

## UI/UX Patterns

### Password Field Handling

```tsx
<Input
  type="password"
  placeholder={hasPassword ? "••••••••" : "Enter password"}
  required={!hasPassword} // Only required if no existing password
/>
```

### Optimistic UI with Error Recovery

```typescript
const handleTest = async () => {
  setIsTesting(true);
  setMessage(null); // Clear previous message

  const result = await testSmtpSettings(formData);

  setMessage({
    type: result.success ? "success" : "error",
    text: result.success ? "Connection successful!" : result.error,
  });
  setIsTesting(false);
};
```

## What Would I Do Differently

### 1. Use a Job Queue for Email Sending

Current implementation sends emails synchronously in the cron handler. For high volume:
- Use a queue (BullMQ, SQS, etc.)
- Separate "enqueue" from "send"
- Better retry handling and observability

### 2. Add Email Templates

Currently generating HTML inline. Better approach:
- Separate template files (`.mjml` or React Email)
- Preview capability in admin UI
- Variable substitution system

### 3. Consider React-PDF for Attachments

The handover doc mentioned using `@react-pdf/renderer`. Current implementation sends HTML in email body. For professional reports:
- Generate PDF server-side
- Attach to email
- Better for printing/archiving

## Environment Setup Checklist

```bash
# Required environment variables
APP_SECRET=<64-char-hex>        # openssl rand -hex 32
CRON_SECRET=<random-string>     # openssl rand -base64 32

# Example cron setup (every hour)
0 * * * * curl -H "x-cron-secret: $CRON_SECRET" https://app.example.com/api/cron/process-reports
```

## File Reference

| File | Purpose |
|------|---------|
| `src/lib/encryption.ts` | AES-256-GCM encrypt/decrypt |
| `src/lib/email.ts` | Nodemailer wrapper + validation |
| `src/actions/email-settings.ts` | SMTP config CRUD |
| `src/actions/report-schedules.ts` | Schedule CRUD + processing helpers |
| `src/app/api/cron/process-reports/route.ts` | Cron endpoint |
| `src/components/admin/email-settings-form.tsx` | Admin UI form |
| `src/components/reports/builder/schedule-dialog.tsx` | Schedule dialog |

---

*Last updated: 2026-01-03*
