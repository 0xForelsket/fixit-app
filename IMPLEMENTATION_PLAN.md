# FixIt - CMMS Lite Implementation Plan

## 1. Project Overview
**Goal:** A lightweight, self-hosted web application for tracking machine maintenance requests on a local manufacturing network.
**Core Users:**
- **Operators:** Report issues quickly (scan/select machine -> describe issue).
- **Maintenance Techs:** View, prioritize, and resolve tickets.
- **Supervisors/Admins:** Manage machine lists and view history.

## 2. Tech Stack Strategy
- **Runtime:** Bun (Fast startup, built-in SQLite support).
- **Framework:** Next.js (App Router) for full-stack capabilities.
- **Database:** SQLite (via `bun:sqlite` or `libsql`) managed by **Drizzle ORM**.
  - *Why:* Zero-configuration, single-file database perfect for local intranets.
- **File Storage:** S3-compatible (MinIO for self-hosted, or AWS S3).
  - *Why:* Scalable, easy backups, works across multiple servers if needed.
- **Styling:** Tailwind CSS + **Shadcn UI** (Radix Primitives).
- **Validation:** Zod (schema validation, shared between client and server).
- **Linting:** Biome.

## 3. Database Schema Design

### `users`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `employee_id` | TEXT UNIQUE | Company employee ID (e.g., "EMP-0042") |
| `name` | TEXT | Display name (e.g., "John Smith") |
| `email` | TEXT UNIQUE | Email address (nullable, for notifications) |
| `pin` | TEXT | Hashed PIN for authentication |
| `role` | TEXT | Enum: 'operator', 'tech', 'admin' |
| `is_active` | BOOLEAN | Enable/disable user access |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last modification time |

*Note: User profile photos stored via `attachments` table.*

### `locations`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `name` | TEXT | e.g., "Hall B", "Assembly Line 3" |
| `code` | TEXT UNIQUE | Short code (e.g., "HALL-B", "AL-03") |
| `description` | TEXT | Additional details (nullable) |
| `parent_id` | INTEGER FK | References `locations.id` for hierarchy (nullable) |
| `is_active` | BOOLEAN | Enable/disable location |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last modification time |

*Note: Supports hierarchy (e.g., Building > Floor > Area > Line).*

### `machines`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `name` | TEXT | e.g., "Injection Molder A" |
| `code` | TEXT UNIQUE | e.g., "IM-001" - for QR codes |
| `location_id` | INTEGER FK | References `locations.id` |
| `owner_id` | INTEGER FK | References `users.id` - 5S owner (nullable) |
| `status` | TEXT | Enum: 'operational', 'down', 'maintenance' |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last modification time |

*Note: Machine photos stored via `attachments` table.*

### `tickets`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `machine_id` | INTEGER FK | References `machines.id` |
| `type` | TEXT | Enum: 'breakdown', 'maintenance', 'calibration', 'safety', 'upgrade' |
| `reported_by_id` | INTEGER FK | References `users.id` - who reported |
| `assigned_to_id` | INTEGER FK | References `users.id` - assigned tech (nullable) |
| `title` | TEXT | Short description |
| `description` | TEXT | Long text |
| `priority` | TEXT | Enum: 'low', 'medium', 'high', 'critical' |
| `status` | TEXT | Enum: 'open', 'in_progress', 'resolved', 'closed' |
| `resolution_notes` | TEXT | Notes added when resolving (nullable) |
| `created_at` | TIMESTAMP | When ticket was created |
| `updated_at` | TIMESTAMP | Last modification time |
| `resolved_at` | TIMESTAMP | When ticket was resolved (nullable) |
| `escalated_at` | TIMESTAMP | When ticket was escalated (nullable) |
| `due_by` | TIMESTAMP | SLA deadline based on priority (nullable) |

*Note: Ticket photos (problem evidence, before/after) stored via `attachments` table.*

**SLA defaults (configurable):**
| Priority | Due within |
|----------|------------|
| Critical | 2 hours |
| High | 8 hours |
| Medium | 24 hours |
| Low | 72 hours |

### `maintenance_schedules`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `machine_id` | INTEGER FK | References `machines.id` |
| `title` | TEXT | e.g., "Annual Calibration" |
| `type` | TEXT | Enum: 'maintenance', 'calibration' |
| `frequency_days` | INTEGER | e.g., 30, 90, 365 |
| `last_generated` | DATE | When the last ticket was created |
| `next_due` | DATE | Calculated date for next occurrence |
| `is_active` | BOOLEAN | Enable/disable schedule |
| `created_at` | TIMESTAMP | Record creation time |

### `ticket_logs`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `ticket_id` | INTEGER FK | References `tickets.id` |
| `action` | TEXT | Enum: 'status_change', 'comment', 'assignment' |
| `old_value` | TEXT | Previous value (nullable) |
| `new_value` | TEXT | New value |
| `created_by_id` | INTEGER FK | References `users.id` - who made the change |
| `created_at` | TIMESTAMP | When change occurred |

### `attachments`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `entity_type` | TEXT | Enum: 'user', 'machine', 'ticket', 'location' |
| `entity_id` | INTEGER | ID of the related entity |
| `type` | TEXT | Enum: 'avatar', 'photo', 'document', 'before', 'after' |
| `filename` | TEXT | Original filename |
| `s3_key` | TEXT | S3 object key (path in bucket) |
| `mime_type` | TEXT | e.g., 'image/jpeg', 'application/pdf' |
| `size_bytes` | INTEGER | File size |
| `uploaded_by_id` | INTEGER FK | References `users.id` |
| `created_at` | TIMESTAMP | Upload time |

*Note: Polymorphic table - `entity_type` + `entity_id` link to any entity.*

## 4. API Route Structure

```
# Auth
POST   /api/auth/login            # Authenticate with employee_id + PIN
POST   /api/auth/logout           # Clear session
GET    /api/auth/me               # Get current user from session

# Users
GET    /api/users                 # List all users (with filters: role, is_active)
POST   /api/users                 # Create user (admin only)
GET    /api/users/[id]            # Get single user
PATCH  /api/users/[id]            # Update user
DELETE /api/users/[id]            # Deactivate user (soft delete)

# Locations
GET    /api/locations             # List all locations (supports tree view)
POST   /api/locations             # Create location
GET    /api/locations/[id]        # Get single location (with children)
PATCH  /api/locations/[id]        # Update location
DELETE /api/locations/[id]        # Delete location (fails if machines attached)

# Machines
GET    /api/machines              # List all machines (with filters: location_id, status, owner_id)
POST   /api/machines              # Create machine
GET    /api/machines/[id]         # Get single machine
PATCH  /api/machines/[id]         # Update machine (including owner assignment)
DELETE /api/machines/[id]         # Delete machine

# Tickets
GET    /api/tickets               # List tickets (with filters: status, priority, machine_id, assigned_to_id)
POST   /api/tickets               # Create ticket
GET    /api/tickets/[id]          # Get single ticket
PATCH  /api/tickets/[id]          # Update ticket (status, assignment, resolution)

# Attachments
POST   /api/attachments           # Upload file (returns presigned URL or direct upload)
GET    /api/attachments           # List attachments (filter by entity_type, entity_id)
GET    /api/attachments/[id]      # Get attachment metadata + presigned download URL
DELETE /api/attachments/[id]      # Delete attachment (removes from S3)

# Notifications
GET    /api/notifications         # List user's notifications (with unread count)
PATCH  /api/notifications/[id]    # Mark as read
POST   /api/notifications/read-all # Mark all as read
GET    /api/notifications/stream  # SSE endpoint for real-time updates (optional)

# Reports
GET    /api/reports/tickets       # Ticket history (filters: date, machine, type) + CSV export
GET    /api/reports/machines/[id] # Machine report (tickets, downtime, MTBF)
GET    /api/reports/metrics       # MTTR, MTBF, resolution rate, etc.
GET    /api/reports/trends        # Time-series data for charts

# Scheduler
POST   /api/scheduler/run         # Trigger maintenance + escalation check (requires cron secret)
GET    /api/scheduler/status      # View pending schedules

# Stats
GET    /api/stats                 # Dashboard statistics

# Health
GET    /api/health                # Health check for monitoring
```

## 5. Validation Strategy

Zod schemas will be defined in `src/lib/validations/` and shared between:
- **Server:** API route handlers validate incoming requests
- **Client:** Form validation before submission (react-hook-form + zod resolver)

Example structure:
```
src/lib/validations/
├── users.ts       # userSchema, createUserSchema, loginSchema
├── locations.ts   # locationSchema, createLocationSchema
├── machines.ts    # machineSchema, createMachineSchema
├── tickets.ts     # ticketSchema, createTicketSchema, updateTicketSchema
├── attachments.ts # attachmentSchema, uploadSchema
└── index.ts       # Re-exports all schemas
```

## 6. Scheduler Design

**Problem:** Dashboard-triggered checks are unreliable if no one opens the app.

**Solution:** Hybrid approach
1. **Primary:** System cron job calls `POST /api/scheduler/run` daily at 6:00 AM
2. **Fallback:** Dashboard load also triggers the check (idempotent)
3. **Logic:**
   - Query all schedules where `next_due <= today` AND `is_active = true`
   - For each due schedule:
     - Create a new ticket with type from schedule
     - Update `last_generated` to today
     - Calculate and update `next_due` = today + `frequency_days`
   - Return count of generated tickets

**Cron setup example (production):**
```bash
0 6 * * * curl -X POST http://localhost:3000/api/scheduler/run
```

## 7. Authentication & Security

**Approach:** Cookie-based session with individual user accounts
- Users authenticate with Employee ID + PIN
- Session stored in HTTP-only cookie
- Role determines access level

**Login flow:**
1. User enters Employee ID and PIN on login page
2. Server validates against `users` table (PIN is hashed with bcrypt)
3. On success, create session cookie with user ID
4. Redirect to role-appropriate dashboard

**Middleware:** Check session and role on protected routes
- `/report/*` — Requires operator+ role (any authenticated user)
- `/dashboard/*` — Requires tech+ role
- `/admin/*` — Requires admin role

**Security measures:**
| Measure | Implementation |
|---------|----------------|
| Session timeout | 8 hours idle, 24 hours max (configurable) |
| Brute force protection | Lock account after 5 failed attempts, unlock after 15 min |
| PIN requirements | Minimum 4 digits, stored with bcrypt |
| Scheduler API auth | Require `X-Cron-Secret` header matching env variable |
| CORS | Restrict to same origin (intranet) |

**Environment variables:**
```env
SESSION_SECRET=your-secret-key-here
SESSION_MAX_AGE=86400              # 24 hours in seconds
CRON_SECRET=your-cron-secret-here  # For scheduler endpoint
```

**Default admin:** Seed script creates initial admin user for first-time setup.

## 8. File Storage (S3/MinIO)

**Configuration:**
```env
S3_ENDPOINT=http://localhost:9000    # MinIO endpoint (or AWS S3 URL)
S3_REGION=us-east-1
S3_BUCKET=fixit-attachments
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

**Bucket structure:**
```
fixit-attachments/
├── users/{user_id}/avatar.jpg
├── machines/{machine_id}/{attachment_id}.jpg
├── tickets/{ticket_id}/{attachment_id}.jpg
└── locations/{location_id}/{attachment_id}.jpg
```

**Upload flow:**
1. Client requests presigned upload URL from `POST /api/attachments`
2. Client uploads directly to S3/MinIO using presigned URL
3. Client confirms upload, server creates `attachments` record
4. For display, server generates presigned download URLs (1hr expiry)

**MinIO setup (Docker):**
```bash
docker run -d --name minio \
  -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

## 9. Notifications

**Notification triggers:**
| Event | Recipients | Channel |
|-------|------------|---------|
| New critical/high ticket | All active techs | In-app + Email (optional) |
| Ticket assigned to you | Assigned tech | In-app + Email |
| Your machine has new ticket | Machine 5S owner | In-app + Email |
| Ticket escalated (overdue) | Admins + assigned tech | In-app + Email |
| Scheduled maintenance due | Assigned tech or all techs | In-app |

**Implementation:**
- **In-app:** `notifications` table + polling or Server-Sent Events (SSE)
- **Email:** Optional, via SMTP (Nodemailer) - configurable per user

**New table: `notifications`**
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER FK | References `users.id` |
| `type` | TEXT | Enum: 'ticket_created', 'ticket_assigned', 'ticket_escalated', 'maintenance_due' |
| `title` | TEXT | Notification title |
| `message` | TEXT | Notification body |
| `link` | TEXT | URL to navigate to (e.g., `/dashboard/tickets/123`) |
| `is_read` | BOOLEAN | Read status |
| `created_at` | TIMESTAMP | When created |

**Environment variables (optional email):**
```env
SMTP_HOST=smtp.company.com
SMTP_PORT=587
SMTP_USER=notifications@company.com
SMTP_PASS=secret
SMTP_FROM=FixIt <notifications@company.com>
```

## 10. Reporting & Metrics

**Key metrics:**
| Metric | Description | Calculation |
|--------|-------------|-------------|
| **MTTR** | Mean Time To Repair | Avg(`resolved_at` - `created_at`) for resolved tickets |
| **MTBF** | Mean Time Between Failures | Avg time between breakdown tickets per machine |
| **Downtime** | Machine downtime | Sum of time machine status = 'down' |
| **Open tickets** | Current backlog | Count where status = 'open' or 'in_progress' |
| **Resolution rate** | Tickets closed per day/week | Count resolved in period |

**New table: `machine_status_logs`** (for downtime tracking)
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `machine_id` | INTEGER FK | References `machines.id` |
| `old_status` | TEXT | Previous status |
| `new_status` | TEXT | New status |
| `changed_by_id` | INTEGER FK | References `users.id` (nullable for system) |
| `changed_at` | TIMESTAMP | When status changed |

**Reports available:**
- **Ticket history:** Filter by date range, machine, type, tech - export CSV/PDF
- **Machine report:** All tickets for a machine, downtime history, MTBF
- **Tech performance:** Tickets resolved, avg resolution time per tech
- **Trend charts:** Tickets over time (daily/weekly/monthly), by type, by priority

**API endpoints:**
```
GET /api/reports/tickets      # Ticket history with filters, supports CSV export
GET /api/reports/machines/[id] # Machine-specific report
GET /api/reports/metrics      # Dashboard metrics (MTTR, MTBF, etc.)
GET /api/reports/trends       # Time-series data for charts
```

## 11. PWA & Offline Support

**Goals:**
- Operators can view machine list and submit tickets even with spotty wifi
- App is installable on tablets/phones for quick access

**Implementation:**
- **Service Worker:** Cache static assets + machine list
- **Offline queue:** Store ticket submissions in IndexedDB, sync when online
- **Manifest:** App icon, name, theme color for install prompt

**Offline capabilities:**
| Feature | Offline Behavior |
|---------|------------------|
| View machine list | Cached, available offline |
| View machine details | Cached if previously viewed |
| Create ticket | Queued locally, synced when online |
| View own pending tickets | Cached |
| Dashboard/Admin | Online only (shows offline message) |

**Sync indicator:** Show pending count badge, auto-sync on reconnect

**Files:**
```
public/
├── manifest.json
├── sw.js                    # Service worker
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## 12. Backup Strategy

**SQLite backup:**
```bash
# Daily backup via cron (keep 7 days)
0 2 * * * sqlite3 /data/local.db ".backup '/backups/fixit-$(date +%Y%m%d).db'"
find /backups -name "fixit-*.db" -mtime +7 -delete
```

**MinIO/S3 backup:**
- Enable versioning on bucket (protects against accidental deletes)
- For MinIO: Use `mc mirror` to sync to secondary location
```bash
mc mirror minio/fixit-attachments backup/fixit-attachments
```

**Full backup script:** Include in Docker setup
- Stop app (optional, for consistency)
- Backup SQLite
- Sync S3 bucket
- Restart app

## 13. Testing Strategy

**Test types:**
| Type | Tools | Coverage |
|------|-------|----------|
| Unit tests | Vitest | Validation schemas, utility functions, scheduler logic |
| Integration tests | Vitest + supertest | API routes, database operations |
| E2E tests | Playwright | Critical user flows (login, create ticket, resolve ticket) |

**Key test scenarios:**
- Auth: Login success/failure, session expiry, role-based access
- Tickets: Create, assign, resolve, escalation logic
- Scheduler: Due schedule creates ticket, updates next_due correctly
- Attachments: Upload, download, delete with S3
- Offline: Queue ticket, sync on reconnect

**CI pipeline:**
```yaml
# Run on every PR
- lint (biome)
- type-check (tsc)
- unit + integration tests
- e2e tests (against test DB + mock S3)
```

## 14. Development Phases

### Phase 1: Foundation & Scaffold
- [ ] Initialize Next.js project with Bun
- [ ] Setup Biome for linting + Vitest for testing
- [ ] Setup Drizzle ORM + SQLite
- [ ] Define database schema (all tables including notifications, machine_status_logs)
- [ ] Create Zod validation schemas
- [ ] Setup MinIO (Docker) + S3 client library
- [ ] Seed database with default admin, dummy users, locations, and machines

### Phase 2: Core API (The "Brain")
- [ ] Implement attachments API (upload/download/delete with S3)
- [ ] Implement location CRUD API routes
- [ ] Implement user CRUD API routes (with brute force protection)
- [ ] Implement machine CRUD API routes (with status logging)
- [ ] Implement ticket CRUD API routes (with SLA due_by calculation)
- [ ] Implement scheduler logic (maintenance + escalation check)
- [ ] Create `POST /api/scheduler/run` endpoint (with cron secret auth)
- [ ] Add stats + metrics endpoints for dashboard
- [ ] Write unit + integration tests for core logic

### Phase 3: Operator Interface (The "Input")
- [ ] **Home Page:** Searchable list of machines (with photos)
- [ ] **Report Page:** `/report/[code]` - Pre-selected machine from QR scan
- [ ] **Create Ticket Form:**
  - Select machine (if not pre-selected)
  - Select ticket type
  - Select priority (visual buttons)
  - Title and description input
  - Photo upload (capture problem evidence)
  - Submit -> Success toast -> Redirect

### Phase 4: Maintenance Dashboard (The "Management")
- [ ] **Dashboard View:**
  - Stats cards (Open, High Priority, MTTR, overdue count)
  - Active tickets list (sortable, filterable, overdue highlighted)
  - Trend charts (tickets over time)
- [ ] **Ticket Detail View:**
  - Full ticket information with attached photos
  - SLA countdown / overdue indicator
  - Change status workflow
  - Assign technician
  - Add resolution notes + before/after photos when closing
- [ ] **Notifications:**
  - Bell icon with unread count
  - Notification dropdown/panel
  - Mark as read

### Phase 5: Admin & Settings
- [ ] **User Management:** Add/Edit/Deactivate users, upload avatars, reset PIN
- [ ] **Location Management:** Add/Edit/Delete locations (hierarchical tree view)
- [ ] **Machine Management:** Add/Edit/Delete machines, assign locations + 5S owners, upload photos
- [ ] **Schedule Management:** Create/Edit maintenance schedules
- [ ] **SLA Configuration:** Set due times per priority level
- [ ] **QR Code Generator:** Print page for machine QR codes
  - Links to `/report/[code]` (e.g., `/report/IM-001`)
  - Include machine name, code, location path
  - Include 5S owner info: name, photo, employee ID
- [ ] **Reports Page:**
  - Ticket history with filters + CSV/PDF export
  - Machine reports (downtime, MTBF)
  - Tech performance metrics

### Phase 6: Authentication & Security
- [ ] Implement login page (Employee ID + PIN)
- [ ] Add session management (timeout, max age)
- [ ] Protected route middleware (role-based)
- [ ] Brute force protection (account lockout)
- [ ] CORS configuration

### Phase 7: PWA & Offline
- [ ] Setup service worker + manifest.json
- [ ] Cache machine list for offline viewing
- [ ] Offline ticket queue (IndexedDB)
- [ ] Background sync on reconnect
- [ ] Install prompt + app icons

### Phase 8: Polish & Testing
- [ ] Error handling & toast notifications
- [ ] Responsive design (tablet/mobile focus)
- [ ] Loading states and optimistic updates
- [ ] Dark mode support
- [ ] Keyboard shortcuts for power users
- [ ] E2E tests with Playwright

### Phase 9: Deployment
- [ ] Production build script
- [ ] Environment variable documentation
- [ ] Docker Compose (app + MinIO + SQLite volume)
- [ ] Backup scripts (SQLite + S3)
- [ ] Setup instructions for cron jobs (scheduler + backup)
- [ ] Health check endpoint

## 15. Visual Style Guide
- **Color Palette:**
  - **Primary:** Slate/Blue (Professional, Industrial)
  - **Danger/Critical:** Vivid Red (For "Line Down" scenarios)
  - **Success:** Green (For "Resolved")
  - **Warning:** Amber (For "Maintenance Required")
- **Typography:** Inter or system sans-serif (Clean, readable)
- **Layout:**
  - Mobile: Full-width cards, large buttons (thumb-friendly)
  - Desktop: Sidebar navigation, data tables

## 16. File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (operator)/
│   │   ├── page.tsx              # Machine list
│   │   └── report/[code]/page.tsx
│   ├── (tech)/
│   │   └── dashboard/
│   │       ├── page.tsx          # Dashboard
│   │       └── tickets/[id]/page.tsx
│   ├── (admin)/
│   │   └── admin/
│   │       ├── users/page.tsx
│   │       ├── locations/page.tsx
│   │       ├── machines/page.tsx
│   │       ├── schedules/page.tsx
│   │       ├── reports/page.tsx
│   │       ├── settings/page.tsx  # SLA config, etc.
│   │       └── qr-codes/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── locations/
│   │   ├── machines/
│   │   ├── tickets/
│   │   ├── notifications/
│   │   ├── attachments/
│   │   ├── reports/
│   │   ├── scheduler/
│   │   ├── stats/
│   │   └── health/               # Health check endpoint
│   ├── layout.tsx
│   ├── manifest.ts               # PWA manifest (Next.js 13+)
│   └── globals.css
├── components/
│   ├── ui/                       # Shadcn components
│   ├── users/
│   ├── locations/
│   ├── machines/
│   ├── tickets/
│   ├── notifications/            # Bell, dropdown, list
│   ├── attachments/              # Upload, gallery, image viewer
│   ├── reports/                  # Charts, export buttons
│   ├── dashboard/
│   └── offline/                  # Sync indicator, pending queue
├── db/
│   ├── index.ts                  # DB connection
│   └── schema.ts                 # Drizzle schema
├── lib/
│   ├── validations/              # Zod schemas
│   ├── s3.ts                     # S3/MinIO client + helpers
│   ├── auth.ts                   # Session helpers
│   ├── notifications.ts          # Create/send notifications
│   ├── sla.ts                    # SLA calculation helpers
│   ├── offline.ts                # IndexedDB queue helpers
│   └── utils.ts
├── hooks/
│   ├── use-notifications.ts      # Poll/SSE for notifications
│   ├── use-offline-queue.ts      # Manage offline submissions
│   └── use-online-status.ts      # Detect online/offline
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
public/
├── sw.js                         # Service worker
└── icons/
    ├── icon-192.png
    └── icon-512.png
```
