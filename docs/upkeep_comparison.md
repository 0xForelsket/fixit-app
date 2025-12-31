# UpKeep vs Fixit-App: Feature Comparison

Based on analysis of [UpKeep.com](https://www.upkeep.com/features) and your screenshot, here's a breakdown of features you may want to add.

## Screenshot Reference
![UpKeep Work Orders Interface](/home/sdhui/.gemini/antigravity/brain/ac36affa-d40d-4886-ab25-d54692b3a951/uploaded_image_1767156574897.png)

---

## ✅ Features You Already Have

| Feature | UpKeep | Fixit-App |
|---------|--------|-----------|
| **Work Orders** | ✅ | ✅ `workOrders` table with status, priority, assignee |
| **Preventive Maintenance Schedules** | ✅ | ✅ `maintenanceSchedules` with frequency-based triggers |
| **Maintenance Checklists** | ✅ | ✅ `maintenanceChecklists` + `checklistCompletions` |
| **Parts & Inventory** | ✅ | ✅ `spareParts`, `inventoryLevels`, `inventoryTransactions` |
| **Equipment/Asset Management** | ✅ | ✅ Full hierarchy: categories → types → models → equipment |
| **Locations (Hierarchical)** | ✅ | ✅ `locations` with parent/child structure |
| **QR Codes** | ✅ | ✅ `/assets/qr-codes` page exists |
| **Vendors** | ✅ | ✅ `vendors` table with contact info |
| **Labor/Time Tracking** | ✅ | ✅ `laborLogs` table with start/end times |
| **Notifications** | ✅ | ✅ `notifications` table + in-app preferences |
| **Audit Logs** | ✅ | ✅ `auditLogs` table |
| **Work Order Attachments** | ✅ | ✅ `attachments` table (photos, documents) |
| **Departments/Teams** | ✅ | ✅ `departments` table with manager |
| **User Roles/Permissions** | ✅ | ✅ `roles` table with permissions array |

---

## ❌ Features You're Missing

### 1. **Shared Work Orders** 🔴 High Priority
UpKeep allows sharing work orders with vendors/customers who aren't full users.

> [!IMPORTANT]
> From the screenshot, notice the "Shared Work Orders" menu item. This lets you share specific work orders with external parties (contractors, customers) via a shareable link.

**What to add:**
- Add `shareToken` and `isShared` fields to `workOrders`
- Create public view page at `/shared/work-orders/[token]`
- Allow limited external commenting

---

### 2. **Request Portal (Work Requests)** 🔴 High Priority
UpKeep has a separate "Request Portal" for unlimited free requesters to submit maintenance requests.

> [!WARNING]
> This is different from creating work orders. Non-tech staff can submit *requests* which admins then convert to work orders.

**What to add:**
```
workRequests table:
  - id, title, description, priority
  - requesterId (nullable for anonymous)
  - requesterEmail, requesterName (for external)
  - status: 'pending' | 'approved' | 'rejected' | 'converted'
  - convertedWorkOrderId
  - locationId, assetId (optional)
```
- Public request submission form
- Admin queue to review/approve/convert requests

---

### 3. **Meter/Runtime-Based Maintenance** 🟡 Medium Priority
UpKeep supports triggering PM based on:
- **Time interval** (you have this ✅)
- **Meter readings** (machine hours, vehicle mileage, cycle counts)

**What to add:**
```
equipmentMeters table:
  - id, equipmentId, name (e.g., "Operating Hours")
  - unit (hours, miles, cycles)
  - currentReading, lastReadingDate
  
maintenanceSchedules additions:
  - triggerType: 'time' | 'meter' | 'both'
  - meterThreshold (e.g., every 500 hours)
  - meterId
```

---

### 4. **Purchase Orders & Invoice Management** 🟡 Medium Priority
UpKeep has a full purchasing workflow.

**What to add:**
```
purchaseOrders table:
  - id, poNumber, vendorId, status
  - requestedById, approvedById
  - totalAmount, taxAmount
  - dueDate, deliveryDate
  
purchaseOrderItems table:
  - poId, partId, quantity, unitPrice
  
invoices table:
  - poId, invoiceNumber, amount, paidAt
```

---

### 5. **Depreciation Tracking** 🟡 Medium Priority
UpKeep tracks asset depreciation schedules.

**What to add to `equipment` or new `equipmentFinancials` table:**
```
- purchaseDate, purchasePrice
- depreciationMethod: 'straight-line' | 'declining-balance'
- usefulLifeYears, salvageValue
- currentBookValue (computed)
```

---

### 6. **Warranty Tracking** 🟡 Medium Priority
Track warranties per asset with expiry alerts.

**What to add:**
```
equipmentWarranties table:
  - id, equipmentId, warrantyType
  - provider, policyNumber
  - startDate, endDate
  - coverageDetails, claimInstructions
```

---

### 7. **Downtime Tracking & MTBF/MTTR Analytics** 🟡 Medium Priority
You have `equipmentStatusLogs` but UpKeep has dedicated downtime analytics.

**What to add:**
- Calculate **MTBF** (Mean Time Between Failures)
- Calculate **MTTR** (Mean Time To Repair)
- Downtime cost tracking (equipment cost per hour × downtime)
- Dashboard widget: "Total Downtime This Month"

---

### 8. **Workflow Automation / Auto-Assignment** 🟠 Nice-to-Have
Auto-assign work orders based on rules:
- Asset type → specific technician
- Priority level → on-call tech
- Location → nearest technician

**What to add:**
```
automationRules table:
  - id, name, isActive
  - triggerEvent: 'work_order_created' | 'request_submitted'
  - conditions (JSON): { priority: 'critical', assetType: 'HVAC' }
  - actions (JSON): { assignTo: userId, setDueDate: '+4h' }
```

---

### 9. **Bookmarking / Quick Filters** 🟠 Nice-to-Have
From the screenshot: "Bookmarked" filter button to save work orders.

**Current Status:**
- You already have `userFavorites` table and `FavoriteButton` component.
- Currently limited to `equipment` only.
- `getUserFavorites` action is hardcoded to fetch equipment details.

**Implementation Plan:**
1. **Schema Update:**
   ```typescript
   export const favoriteEntityTypes = ["equipment", "work_order"] as const;
   ```
2. **Server Action Update (`src/actions/favorites.ts`):**
   - Update `getUserFavorites` to handle multiple entity types.
   - Fetch Work Order details (title, status, priority) when `entityType === "work_order"`.
3. **UI Update:**
   - Add `<FavoriteButton entityType="work_order" entityId={wo.id} />` to `WorkOrderHeader`.
   - Create a "Saved Items" dashboard widget listing both equipment and work orders.

---

### 10. **Files/Documents Hub** 🟠 Nice-to-Have
UpKeep has a "Files" menu for centralized document management.

**Current Status:**
- You have a polymorphic `attachments` table linking files to entities (`work_order` | `equipment`).
- No centralized view exists; files are only visible on their parent entity's page.

**Implementation Plan:**
1. **New Page: `/documents`:**
   - A global file browser.
   - **Sidebar/Filters:** Filter by Type (Image, PDF), Entity (Machine A, Work Order #123), or Uploader.
2. **Virtual Folders:**
   - Use `entityType` as top-level folders (e.g., "Equipment Manuals", "Work Order Reports").
   - Use `entityId` (resolved to name) as sub-folders.
3. **Global Search Action:**
   - Create `getAllAttachments()` server action.
   - Search by `filename` or `notes`.
   
**Proposed UI Structure:**
```
[ Search Documents... ] [ Upload New ]

📁 Equipment Manuals (14)
   ├── 📄 Pump A Manual.pdf
   └── 📁 Generator B
       ├── 📷 Installation.jpg
       └── 📄 Maintenance_Log.pdf
📁 Work Order Reports (42)
   └── ...
```

---

### 11. **People & Teams Management** 🟠 Nice-to-Have
UpKeep separates "People & Teams" from "Vendors & Customers".

**Current Status:**
- You have `users` linked to `departments`.
- Work orders can be assigned to a `User` OR a `Department`.
- This functionally matches "Teams".

**Gap Analysis:**
- **Ad-hoc Teams:** You lack cross-functional teams (e.g., "Safety Committee" containing members from Elec and Mech).
- **Shift Management:** No way to group by "Night Shift" vs "Day Shift".

**Implementation Plan:**
1. **Stick with Departments for now.** Your `departments` table works well for functional teams.
2. **Future: Add `teams` table (Many-to-Many):**
   If you need ad-hoc groups:
   ```typescript
   export const teams = sqliteTable("teams", { ... });
   export const teamMembers = sqliteTable("team_members", {
     teamId: integer("team_id"),
     userId: integer("user_id")
   });
   ```
3. **Immediate Action:** Rename "Departments" to "Teams & Departments" in UI if you want to sound more flexible, or just ensure every user belongs to a department.

---

### 12. **Mobile Push Notifications** 🟠 Nice-to-Have
UpKeep emphasizes mobile push notifications for technician assignment.

Consider adding:
- Web Push API integration
- Firebase Cloud Messaging for mobile
- `pushToken` field on users

---

## 📊 Priority Summary

| Priority | Feature | Effort |
|----------|---------|--------|
| 🔴 High | Request Portal (Work Requests) | Medium |
| 🔴 High | Shared Work Orders | Low |
| 🟡 Medium | Meter-Based Maintenance | Medium |
| 🟡 Medium | Purchase Orders | High |
| 🟡 Medium | Warranty Tracking | Low |
| 🟡 Medium | Depreciation Tracking | Low |
| 🟡 Medium | MTBF/MTTR Analytics | Medium |
| 🟠 Nice | Workflow Automation | High |
| 🟠 Nice | Work Order Bookmarks | Low |
| 🟠 Nice | Files Hub | Medium |
| 🟠 Nice | Teams (vs Departments) | Low |
| 🟠 Nice | Push Notifications | Medium |

---

## 🎯 Recommended Next Steps

1. **Start with Request Portal** — This unlocks the "unlimited free requesters" model that UpKeep uses
2. **Add Shared Work Orders** — Quick win, enables contractor collaboration
3. **Implement MTBF/MTTR calculations** — Use your existing `equipmentStatusLogs` data
4. **Add Meter Tracking** — Differentiator for industrial use cases
