# Implementation Plan: Remaining Core Features

This plan outlines the steps to implement the missing "basic" features identified for the MVP+.

## 1. User Settings (Self-Service)
**Goal:** Allow users to manage their own credentials, profile details, and app preferences without admin intervention.

### 1.1 Database Schema
- [ ] **Schema Update**: Add `preferences` JSON column to `users` table.
  - Structure: `{ theme: 'system' | 'light' | 'dark', density: 'compact' | 'comfortable', homePage: string, notifications: { email: boolean } }`
- [ ] **Migration**: Generate and push migration.

### 1.2 Backend Actions
- [ ] **`updateProfile`**: Handle Name and Email updates.
- [ ] **`changePin`**: Securely update PIN (require `currentPin` verification).
- [ ] **`updatePreferences`**: Update the JSON preferences object.
- [ ] **`revokeSessions`**: Invalidate all session tokens for the user (security feature).

### 1.3 UI Implementation (`/profile/settings`)
- [ ] **Profile Form**: Edit Name/Email.
- [ ] **Security Card**: Change PIN form + "Log out all other devices" button.
- [ ] **Appearance Card**:
  - Theme Selector (System/Light/Dark).
  - Density Toggle (Compact/Comfortable) - *Affects table row heights globally*.
- [ ] **Notifications Card**: Toggle email alert preferences.

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
