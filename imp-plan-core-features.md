# Implementation Plan: Remaining Core Features

This plan outlines the steps to implement the missing "basic" features identified for the MVP+.

## 1. User Settings (Self-Service)
**Goal:** Allow users to manage their own credentials and profile details without admin intervention.
- [ ] **Backend**: Add `updateProfile` server action to handle Name, Email, and PIN updates.
  - *Note:* PIN updates must require verifying the *current* PIN first for security.
- [ ] **UI**: Update `/profile/page.tsx` to include an "Edit Profile" form.
  - Fields: Name, Email (optional), Current PIN, New PIN.
  - Use a dialog or a dedicated settings tab.

## 2. Global Search (Command Palette)
**Goal:** Provide quick navigation to any entity in the system via `CMD+K`.
- [ ] **Component**: Create a `GlobalSearch` component using `cmdk` (already in package.json).
- [ ] **Data Fetching**: Create a new API route `/api/search/global` that matches:
  - Work Orders (`#123`, `Broken Pump`)
  - Equipment (`P-101`, `Centrifugal Pump`)
  - Parts (`Bearing`, `SKU-999`)
  - Pages (`Dashboard`, `Settings`, `Profile`)
- [ ] **Integration**: Mount the component in `src/components/layout/sidebar.tsx` or the main layout so it's accessible everywhere.

## 3. Notifications Center
**Goal:** Centralized view for alerts beyond just "My Tickets".
- [ ] **Schema**: Create a `notifications` table in `db/schema.ts`.
  - Fields: `userId`, `title`, `message`, `type` (info, success, warning, error), `read` (boolean), `link` (optional), `createdAt`.
- [ ] **Backend**: Add logic to create notifications on key events:
  - Ticket Assigned
  - Ticket Status Changed (for reporter)
  - Inventory Low (for admins/techs)
- [ ] **UI**: Create a `NotificationsPopover` in the header (`src/components/layout/header.tsx`).
- [ ] **Real-time (Optional)**: For now, just poll or revalidate on page load.

## 4. Vendor / Supplier Management
**Goal:** Track where parts and services come from.
- [ ] **Schema**: Create a `vendors` table.
  - Fields: `name`, `contactPerson`, `email`, `phone`, `website`, `address`.
- [ ] **Relation**: Add `vendorId` to `spare_parts` table.
- [ ] **UI**:
  - Add "Vendors" tab under "Assets".
  - CRUD pages for Vendors.
  - Dropdown on Spare Part form to select Vendor.

## 5. Audit Logs (System-Wide)
**Goal:** Track who did what to critical assets.
- [ ] **Schema**: Create `audit_logs` table.
  - Fields: `entityType` (equipment, part, user), `entityId`, `action` (create, update, delete), `actorId` (user), `details` (JSON diff), `createdAt`.
- [ ] **Backend**: Create a helper function `logAudit(action, entity, details)` and insert it into mutations (create/update assets).
- [ ] **UI**: Add an "History" tab to the Equipment Detail and Part Detail pages showing this log.

## Execution Order
1. **User Settings** (Low effort, high value)
2. **Global Search** (High visibility, improves UX)
3. **Vendors** (Required for complete inventory data)
4. **Notifications** (System-level feature)
5. **Audit Logs** (Compliance/Admin feature)
