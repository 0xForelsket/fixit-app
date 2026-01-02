# Handover: Report Email System Implementation

## Status
- **Current State**: No email capability exists.
- **Goal**: Implement dynamic email sending using SMTP (Gmail/Custom) configured via Admin UI.
- **Infrastructure**: `system_settings` table exists and is suitable for storing configuration.

## Strategy: Admin-Configurable SMTP
Instead of `.env` files, we will store SMTP credentials in the database (`system_settings`) to allow runtime configuration.

### 1. Security (Encryption)
Since we are storing passwords in the DB, we **must** encrypt them.
- **File**: `src/lib/encryption.ts`
- **Logic**: Use Node.js `crypto` with **AES-256-GCM** (not CBC) for authenticated encryption (integrity + confidentiality). Use `process.env.APP_SECRET` as the key.
- **Format**: Store as `iv:authTag:ciphertext` (all base64 encoded).

### 2. Email Utility
- **File**: `src/lib/email.ts`
- **Dependencies**: `nodemailer`
- **Flow**:
    1. Fetch `smtp_config` from `system_settings`.
    2. Decrypt password.
    3. Create `nodemailer` transporter.
    4. Send email.
- **Validation**: Validate recipient email addresses before attempting to send.

### 3. Admin UI (Settings)
- **Page**: `src/app/(app)/admin/settings/email/page.tsx`
- **Features**:
    - Form for Host, Port, User, Password (masked), From Address.
    - "Test Connection" button.
    - Save (Encryption happens in the Server Action).
- **Security**: Never return decrypted password to client. On edit, show placeholder; only update password if user provides a new value.

### 4. Integration
- Connect `src/lib/email.ts` to the Report Scheduler.

### 5. Report Scheduling
Once email is working, implement the scheduling logic.
**Constraint**: Keep dependencies minimal.

- **Backend**:
  - `src/actions/report-schedules.ts`: CRUD for schedules using `reportSchedules` table.
  - **Schema additions**: Add `timezone`, `lastError`, `failedAt`, `retryCount` columns to `reportSchedules` table.
  - **API Endpoint (`/api/cron/process-reports`)**:
    - **Trigger**: Intended to be called by an external cron job (e.g., `curl` via Linux crontab) or Vercel Cron. Do **not** install `node-cron`. Since we are running on **Bun**, we could potentially use `setInterval` if the server is long-running, but the API endpoint approach is statistically more robust for maintenance and serverless environments.
    - **Security**: Protect endpoint with `x-cron-secret` header check against `process.env.CRON_SECRET`.
    - **Logic**:
      1. Function `processDueReports()`:
      2. **Acquire lock** (use a `system_settings` row or similar) to prevent duplicate runs if cron fires twice.
      3. Query `reportSchedules` where `nextRunAt <= NOW()` AND `isActive = true`.
      4. For each due schedule:
         - Verify the associated `ReportTemplate` still exists; skip and log warning if deleted.
         - Fetch the template data.
         - **Report Generation**: Use the existing **`@react-pdf/renderer`** library (already in `package.json`) to generate a professional PDF attachment. This is better than raw HTML for printing and archiving.
         - Send email with the PDF attached via `src/lib/email.ts`.
         - **On success**: Update `lastRunAt` = NOW, `nextRunAt` = calculated next run, clear `lastError`/`failedAt`/`retryCount`.
         - **On failure**: Log error, set `lastError`, `failedAt`, increment `retryCount`. **Continue processing remaining schedules** (don't abort loop).
         - **Next run calculation**: For monthly, use `date.setMonth(date.getMonth() + 1)` which handles month-length overflow correctly.
      5. Release lock.

- **Frontend**:
  - **UI Components**: Use existing `src/components/ui/` components (`Dialog`, `Button`, `Select`, `Input`). Do not add new UI libraries.
  - **Flow**:
    - Add "Schedule" button to Report Builder toolbar.
    - Opens `ScheduleDialog` (create this component).
    - User selects Frequency (Daily, Weekly, Monthly), Timezone, and adds Recipient Emails.
    - **Validation**: Validate email addresses client-side before saving.
    - Save calls server action `createReportSchedule`.

### 6. Testing Strategy
- **Encryption**: Unit tests for encrypt/decrypt round-trip, including error cases (tampered ciphertext).
- **Email**: Integration test using mock SMTP (e.g., Ethereal email) or nodemailer's `createTestAccount()`.
- **Cron endpoint**: Test with fixture data; verify locking prevents duplicate processing.
- **Edge cases**: Test with deleted template, invalid emails, SMTP connection failures.

## Next Steps
1. `bun add nodemailer` `bun add -d @types/nodemailer` (Only necessary dependency).
2. Implement encryption helper using native Node `crypto` (AES-256-GCM).
3. Implement `src/lib/email.ts` with validation.
4. Build the Admin Settings UI using existing form components.
5. Update `reportSchedules` schema with new columns (`timezone`, `lastError`, `failedAt`, `retryCount`).
6. Implement Schedule UI and `/api/cron` endpoint with locking and auth.
7. Add tests per testing strategy.
