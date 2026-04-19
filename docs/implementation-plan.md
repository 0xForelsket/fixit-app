# Implementation Plan

This document turns the current product/code audit into an execution plan.

It is intentionally practical:
- It focuses on real gaps in the current codebase, not aspirational roadmap copy.
- It separates trust-and-correctness work from feature work.
- It includes concrete implementation targets, not just themes.

## Progress Checklist

### Phase 1: Immediate Risk and Correctness

- [x] **1. Attachment Authorization Hardening** (P0) — shared auth helpers in `src/lib/attachments-auth.ts`, entity-level checks on all routes
- [x] **2. Maintenance Schedule `nextDue` Behavior** (P0) — `calculateNextScheduleDueDate` helper, time-based schedules compute future due date
- [x] **3. Report Schedule Authorization** (P1) — `reports:view` permission checks on all read actions
- [x] **4. Cron Lock Robustness** (P1) — lock released in `finally` block

### Phase 2: High-Value Product Work

- [ ] **5. Real Scheduled Reports** (P1) — still using placeholder HTML emails
- [ ] **6. Timezone-Correct Report Scheduling** (P1) — `nextRunAt` ignores stored timezone
- [ ] **7. Procurement Workflow** (P1) — no purchase order tables or actions
- [ ] **8. Inventory Reservation / Allocation** (P1) — no reservation fields or logic
- [ ] **9. Offline Workflow Wiring** (P1) — queue primitive exists but not wired into forms
- [ ] **10. Push Notifications** (P2) — in-app SSE only, no web push

### Phase 3: Annoying but Survivable Work

- [ ] **11. Meter-Based Schedule UI Cleanup** (P2) — renders "Every nulld" for usage-based schedules
- [ ] **12. Admin System Tabs Permission Cleanup** (P2) — permissions filtered but bypassed with hardcoded `["*"]`
- [ ] **13. Query Efficiency Improvements** (P2) — in-memory filtering instead of SQL
- [ ] **14. System-Generated Actor Cleanup** (P3) — auto-generated work attributed to triggering user
- [x] **15. Favorites Scope Cleanup** (P3) — explicitly scoped to equipment-only via `favoriteEntityTypes = ["equipment"]`

---

**Completed: 5 / 15**

## Planning Principles

1. Fix trust failures before adding headline features.
2. Prefer removing weak or fake behavior over preserving it for appearances.
3. Finish end-to-end slices, not isolated scaffolding.
4. Add tests for every bug fix that changes system behavior.

## Current Read on the Product

The app already has a strong base:
- Work order lifecycle
- Equipment management
- Preventive maintenance foundations
- Inventory foundations
- Attachments
- Reporting builder
- Notifications
- Analytics and predictions groundwork

The biggest remaining gaps are:
- Authorization consistency
- A few incorrect maintenance behaviors
- Placeholder scheduled-report delivery
- Missing procurement and stock-allocation workflows
- Offline/mobile execution that is only partially built

## Phase 1: Immediate Risk and Correctness

These items should be done first because they affect security, correctness, or operator trust.

### 1. Attachment Authorization Hardening

Priority: `P0`
Effort: `Medium`

#### Why

Attachment access is currently guarded mostly by "logged-in user" checks, which is too weak.
Any authenticated user who can guess an attachment id or storage key may be able to retrieve files they should not see.

#### Current Code

- `src/app/(app)/api/attachments/route.ts`
- `src/app/(app)/api/attachments/[id]/route.ts`
- `src/app/(app)/api/attachments/preview/route.ts`
- `src/actions/attachments.ts`

#### What To Change

Build one shared authorization path for attachments based on the parent entity.

The system should answer:
- What entity is this attachment attached to?
- Can the current user view that entity?
- Can the current user delete attachments for that entity type?

#### Implementation Steps

1. Add a shared helper in `src/actions/attachments.ts` or a new `src/lib/attachments-auth.ts`.
2. Resolve parent-entity authorization by `entityType`.
3. Enforce view checks for:
   - `work_order`
   - `equipment`
   - `user`
   - any other supported entity types
4. Enforce delete permissions by entity type instead of using only `equipment:attachment:delete`.
5. Make `/api/attachments/preview` validate the requested key against a real attachment row rather than trusting the raw `key` query param.
6. Return `403` for unauthorized access and avoid leaking existence where possible.

#### Acceptance Criteria

- A user without work-order visibility cannot list work-order attachments.
- A user without equipment visibility cannot fetch equipment attachment URLs.
- Preview URLs cannot be generated from arbitrary S3 keys.
- Delete rules match the entity type of the attachment.

#### Required Tests

- API tests for list, read, preview, and delete.
- Positive and negative permission cases for each supported entity type.

### 2. Maintenance Schedule `nextDue` Behavior

Priority: `P0`
Effort: `Small`

#### Why

Time-based schedules are currently created or reset as immediately due, which can generate work orders right away. That is incorrect for most PM workflows.

#### Current Code

- `src/actions/maintenance.ts`
- `src/app/(app)/api/scheduler/run/route.ts`

#### What To Change

Time-based schedules should calculate `nextDue` from the configured interval.

Expected behavior:
- On create: `nextDue = now + frequencyDays`
- On update of a time-based schedule: recalculate `nextDue` intentionally
- On conversion from meter-based back to time-based: compute a fresh time-based due date, not `new Date()`

#### Implementation Steps

1. Add a helper like `calculateNextScheduleDueDate(frequencyDays, fromDate = new Date())`.
2. Use that helper in `createScheduleAction`.
3. Use the same helper in `updateScheduleAction` when the schedule is time-based.
4. Preserve meter-based behavior by leaving `nextDue = null` when usage-triggered.
5. Review the scheduler to confirm no drift or duplicate generation behavior is introduced.

#### Acceptance Criteria

- A new 30-day schedule is not immediately due.
- Switching a schedule from meter-based to time-based produces a sensible future date.
- Existing scheduler tests still pass, with new coverage for the corrected behavior.

#### Required Tests

- Action tests for create/update schedule behavior.
- API/scheduler tests ensuring newly created schedules are not processed immediately.

### 3. Report Schedule Authorization Consistency

Priority: `P1`
Effort: `Small`

#### Why

Report schedule mutations require report permission, but some read paths only require login. That inconsistency is how access bugs creep in.

#### Current Code

- `src/actions/report-schedules.ts`

#### What To Change

Standardize the permission model:
- `reports:view` for viewing schedules and templates
- consider adding `reports:schedule` later if needed

#### Implementation Steps

1. Add permission checks to `getSchedulesForTemplate()` and `getSchedule()`.
2. Review all schedule-related calls from the builder UI and ensure the permission model still works cleanly.
3. If schedule management should be stricter than report viewing, introduce a dedicated permission and migrate the builder to it.

#### Acceptance Criteria

- Unauthorized users cannot read report schedule data.
- Existing report-builder behavior still works for authorized users.

#### Required Tests

- Read action tests with authorized and unauthorized users.

### 4. Cron Lock Robustness for Report Processing

Priority: `P1`
Effort: `Small`

#### Why

The scheduled-report processor uses a lock in `system_settings`, but release is not protected by a `finally` path. An exception can leave the lock in place until timeout.

#### Current Code

- `src/app/api/cron/process-reports/route.ts`

#### What To Change

Make lock handling exception-safe and reduce the chance of stale lock behavior.

#### Implementation Steps

1. Wrap report processing in `try/finally`.
2. Release the lock in `finally` when acquired.
3. Keep the existing timeout fallback, but treat it as backup, not the normal unlock path.
4. Add more structured logging around lock acquisition and release.

#### Acceptance Criteria

- Lock is always released after processing completes or throws.
- Re-running the cron endpoint after a failure does not remain blocked unnecessarily.

#### Required Tests

- Route test that simulates a thrown processing error and confirms later runs are not stuck.

## Phase 2: High-Value Product Work

These are the next features to build after the trust/correctness layer is stable.

### 5. Real Scheduled Reports

Priority: `P1`
Effort: `Large`

#### Why

Scheduled reports exist, but delivery is still placeholder-grade. The current cron route emails generated HTML and explicitly labels itself as a placeholder for proper PDF generation.

#### Current Code

- `src/app/api/cron/process-reports/route.ts`
- `src/actions/report-schedules.ts`
- `src/components/reports/builder/*`
- `src/lib/services/report-widgets.ts`

#### What To Build

Implement actual report generation from saved template configuration.

The output should support:
- CSV export for tabular reports
- PDF export for formatted reports
- artifact storage for generated files
- delivery history per schedule run

#### Implementation Steps

1. Reuse the report-template config and widget data services instead of generating fake HTML.
2. Add a report-generation service, for example `src/lib/services/report-generation.ts`.
3. Decide output model:
   - PDF generated with `@react-pdf/renderer` or server-side HTML-to-PDF
   - CSV for table-oriented datasets
4. Persist generated artifacts:
   - S3/MinIO object
   - metadata row for generated report runs if needed
5. Update email delivery to attach or link the real artifact.
6. Record run status, artifact info, duration, and failure reason.

#### Acceptance Criteria

- Scheduled reports contain real widget data.
- The output format is consistent with the selected report template.
- Recipients receive a usable report, not a placeholder email body.

#### Required Tests

- Service tests for widget-data assembly.
- Cron tests for due schedules, successful delivery, and failure recording.

### 6. Timezone-Correct Report Scheduling

Priority: `P1`
Effort: `Medium`

#### Why

The schedule model stores timezone, but recurrence is calculated by mutating a JavaScript `Date` at `8 AM`, which does not actually respect the stored timezone.

#### Current Code

- `src/actions/report-schedules.ts`

#### What To Change

Make "daily/weekly/monthly at 8 AM in timezone X" mean exactly that.

#### Implementation Steps

1. Introduce a timezone-aware date helper.
2. Store either:
   - explicit wall-clock schedule settings, or
   - recurrence + timezone + run hour/minute
3. Recalculate `nextRunAt` using the stored timezone.
4. Review daylight-saving behavior for supported regions.
5. Decide whether missed runs should:
   - catch up once, or
   - skip to the next valid slot

#### Acceptance Criteria

- `nextRunAt` matches the configured timezone.
- Daily/weekly/monthly schedules stay stable across DST boundaries.

### 7. Procurement Workflow

Priority: `P1`
Effort: `Large`

#### Why

Inventory exists, but procurement does not. That means the app can tell you stock is low without helping you actually replenish it in a structured way.

#### Current Code

Inventory and vendors already exist in:
- `src/db/schema.ts`
- `src/actions/vendors.ts`
- `src/lib/services/inventory.ts`

#### What To Build

Add the minimum operational procurement flow:
- purchase orders
- PO line items
- receiving against PO
- supplier references and invoice numbers
- status model: draft, issued, partially_received, received, cancelled

#### Implementation Steps

1. Add new schema tables for purchase orders and line items.
2. Link purchase orders to vendors and parts.
3. Add receiving flows that update inventory transactions and inventory levels.
4. Store supplier reference numbers, invoice references, and received quantities.
5. Expose low-stock items as candidates for PO creation.

#### Acceptance Criteria

- A low-stock part can be added to a PO.
- Receiving against the PO updates stock and transaction history.
- PO status reflects actual receiving progress.

### 8. Inventory Reservation / Allocation

Priority: `P1`
Effort: `Medium`

#### Why

The system tracks on-hand quantity and consumption, but not committed quantity. Without reservation, planners cannot confidently promise stock to specific work orders.

#### What To Build

Add reserved inventory support:
- reserve stock for a work order
- release reservation
- consume against reservation
- show available = on-hand - reserved

#### Implementation Steps

1. Add reservation records or extend `workOrderParts` with reservation states.
2. Decide reservation unit:
   - by part and location
   - optionally by lot if lot tracking is added later
3. Update inventory calculations and low-stock indicators to consider reserved quantity.
4. Add UI to reserve and release stock from a work order.

#### Acceptance Criteria

- Users can see on-hand, reserved, and available quantities.
- Two work orders cannot silently over-commit the same stock.

### 9. Offline Workflow Wiring

Priority: `P1`
Effort: `Large`

#### Why

The app has an offline-status hook and queue primitive, but they are not powering real workflows. For a maintenance app, that is not enough.

#### Current Code

- `src/hooks/use-offline.ts`
- `src/app/offline/page.tsx`

#### What To Build

Start with the core offline-safe flows:
- create work order
- record meter reading
- capture photos/attachments for later upload

#### Implementation Steps

1. Define a supported offline operation contract.
2. Wire queueing into the relevant forms/actions.
3. Persist enough local payload data to replay safely.
4. Add replay conflict handling.
5. Add UI for:
   - queued item count
   - retry state
   - failure state
   - manual retry

#### Acceptance Criteria

- Users can submit a work order while offline and have it sync later.
- Users can record meter readings offline without losing data.
- Attachment uploads are clearly staged and replayed when online.

### 10. Push Notifications

Priority: `P2`
Effort: `Medium`

#### Why

Current notifications are in-app/SSE and email. That is not enough for mobile technician response workflows.

#### Current Code

- `src/lib/notifications.ts`
- notification APIs and SSE routes under `src/app/(app)/api/notifications` and `src/app/(app)/api/sse/notifications`

#### What To Build

Push notifications for:
- work order assignment
- escalation
- high-priority breakdowns
- maintenance due reminders

#### Implementation Steps

1. Choose push target:
   - browser push first
   - mobile wrapper later if needed
2. Add subscription storage.
3. Add permission request UX.
4. Trigger push alongside current in-app notifications for supported types.
5. Allow per-type preference control.

#### Acceptance Criteria

- Assigned technicians receive a push when a work order is assigned.
- Escalations can be delivered outside the app session.

## Phase 3: Annoying but Survivable Work

These do not block trust in the product, but they create confusion, friction, or avoidable maintenance cost.

### 11. Meter-Based Schedule UI Cleanup

Priority: `P2`
Effort: `Small`

#### Why

Several schedule views assume every schedule is day-based and render usage-based schedules badly.

#### Current Code

- `src/app/(app)/assets/equipment/[code]/page.tsx`
- `src/app/(app)/maintenance/schedules/manage/page.tsx`
- related schedule tables/cards

#### What To Change

Render schedules according to mode:
- time-based: `Every 30 days`
- usage-based: `Every 500 hours` or equivalent meter unit

#### Acceptance Criteria

- No `null days`, `0 days`, or misleading text for usage-based schedules.

### 12. Admin System Tabs Permission Cleanup

Priority: `P2`
Effort: `Small`

#### Why

The system tabs currently assume superadmin on the client and show all tabs.

#### Current Code

- `src/app/(app)/admin/system/system-tabs.tsx`

#### What To Change

Pass real permissions from the server and render only allowed tabs.

#### Acceptance Criteria

- The client UI matches the actual permission model.

### 13. Query Efficiency Improvements

Priority: `P2`
Effort: `Medium`

#### Why

Some paths fetch broad datasets and filter in memory. That is acceptable at small scale but will degrade.

#### Current Targets

- `src/actions/lowStockAlerts.ts`
- `src/actions/report-schedules.ts`
- `src/actions/favorites.ts`

#### What To Change

Move filtering into SQL/Drizzle queries where practical.

#### Acceptance Criteria

- These code paths no longer load obviously unnecessary rows.

### 14. System-Generated Actor Cleanup

Priority: `P3`
Effort: `Small`

#### Why

Auto-generated work is sometimes attributed to the triggering user, which weakens the audit trail.

#### Current Code

- `src/actions/meters.ts`
- possibly scheduler-generated work order paths

#### What To Change

Introduce a clear system actor strategy:
- dedicated system user, or
- generated-by metadata separate from user attribution

#### Acceptance Criteria

- Audit logs can distinguish operator actions from system-generated actions.

### 15. Favorites Scope Cleanup

Priority: `P3`
Effort: `Small`

#### Why

Favorites are modeled as generic but effectively implemented as equipment-only.

#### Current Code

- `src/actions/favorites.ts`
- favorites schema definitions in `src/db/schema.ts`

#### What To Change

Choose one:
- make favorites explicitly equipment-only for now, or
- complete the generic entity support

#### Acceptance Criteria

- The model, UI, and implementation all agree on supported favorite types.

## Suggested Execution Order

### Week 1

- Attachment authorization hardening
- Maintenance schedule `nextDue` fix
- Report schedule authorization cleanup
- Cron lock cleanup

### Week 2

- Real scheduled report generation
- Timezone-correct scheduling

### Week 3

- Procurement flow
- Inventory reservation/allocation

### Week 4

- Offline workflow wiring
- Push notifications

### After Week 4

- Meter-based schedule UI cleanup
- Admin tab permission cleanup
- Query efficiency improvements
- Audit actor cleanup
- Favorites cleanup

## Recommended Delivery Style

For each item:

1. Patch the behavior.
2. Add tests for the changed behavior.
3. Run `bun run build:check`, `bun run lint`, and relevant tests.
4. Ship in narrow PRs instead of bundling unrelated work together.

## Definition of Done

An item is not done when code exists.

An item is done when:
- the behavior works end-to-end
- authorization is correct
- tests cover the changed behavior
- the UI reflects the real state of the system
- there is no placeholder or fake output pretending to be complete
