# E2E Test Plan

This document outlines the plan for expanding end-to-end test coverage for the Fixit application.

## Current Test Coverage

| File | Coverage Area | Tests |
|------|---------------|-------|
| `auth.spec.ts` | Authentication | Login flows |
| `equipment.spec.ts` | Admin pages | Equipment, Users, Inventory, Locations |
| `fixtures.ts` | Test utilities | Login helpers for Admin, Tech, Operator |
| `inventory.spec.ts` | Inventory | Parts management |
| `maintenance-auto-check.spec.ts` | Maintenance | Schedule creation, scheduler run, checklist completion |
| `maintenance.spec.ts` | Maintenance | Basic maintenance tests |
| `navigation.spec.ts` | Navigation | Route navigation |
| `operator.spec.ts` | Operator | Operator flows |
| `seeded-data.spec.ts` | Data verification | Verify seeded data visibility |
| `tickets.spec.ts` | Tickets | Ticket management |
| `users.spec.ts` | Users | User management |

---

## Phase 1: CSV Import Wizard (Priority: HIGH)

### `import-wizard.spec.ts`

The import wizard supports importing: **Equipment**, **Spare Parts**, **Locations**, and **Users**.

#### Test Cases

| Test ID | Test Name | Description | Priority |
|---------|-----------|-------------|----------|
| IMP-001 | Admin can access import page | Navigate to `/admin/import` and verify wizard loads | P0 |
| IMP-002 | Resource selection works | Click each resource type button and verify step changes to "upload" | P0 |
| IMP-003 | Download template for each resource | Click "Download Template" and verify CSV is downloaded | P1 |
| IMP-004 | Valid CSV upload shows preview | Upload valid CSV and verify preview table displays | P0 |
| IMP-005 | Invalid file type rejected | Upload non-CSV file (.xlsx, .txt) and verify error message | P1 |
| IMP-006 | Empty CSV rejected | Upload CSV with only headers and verify error | P1 |
| IMP-007 | Missing required columns error | Upload CSV missing required columns and verify validation error | P0 |
| IMP-008 | Duplicate strategy selection | Change duplicate handling dropdown and verify state | P1 |
| IMP-009 | Validate Only button works | Click "Validate Only" and verify validation results display | P0 |
| IMP-010 | Equipment import success | Import valid equipment CSV and verify success state | P0 |
| IMP-011 | Locations import success | Import valid locations CSV with parent relationships | P0 |
| IMP-012 | Spare parts import success | Import valid spare parts CSV | P0 |
| IMP-013 | Users import success | Import valid users CSV | P0 |
| IMP-014 | Import with duplicates - skip | Import with existing records, verify skipped count | P1 |
| IMP-015 | Import with duplicates - update | Change strategy to "update", verify updated count | P1 |
| IMP-016 | Import with duplicates - error | Change strategy to "error", verify error response | P1 |
| IMP-017 | Cancel/Reset wizard | Click cancel/back buttons and verify wizard resets | P1 |
| IMP-018 | Tech cannot access import | Verify tech role gets access denied | P2 |
| IMP-019 | Operator cannot access import | Verify operator role gets access denied | P2 |

#### Test Data Fixtures Needed

```typescript
// e2e/fixtures/import-data.ts
export const validEquipmentCSV = `code,name,location_code,model_name,type_code,owner_employee_id,status
EQ-TEST-001,Test CNC Lathe,PLANT-A,Haas VF-2,CNC,TECH-001,operational
EQ-TEST-002,Test Hydraulic Press,PLANT-B,Parker 500T,PRESS,,maintenance`;

export const validLocationsCSV = `code,name,description,parent_code
LOC-TEST-A,Test Plant A,Test facility,
LOC-TEST-A-L1,Test Line 1,Test assembly line,LOC-TEST-A`;

export const validSparePartsCSV = `sku,name,category,description,barcode,unit_cost,reorder_point,lead_time_days
SPR-TEST-001,Test Seal Kit,hydraulic,Test seals,,25.50,10,7`;

export const validUsersCSV = `employee_id,name,email,pin,role_name,hourly_rate
TEST-USER-001,Test User,test@example.com,9999,tech,50.00`;

export const invalidCSV = `invalid,headers,only`;
```

---

## Phase 2: Work Order Enhancements (Priority: HIGH)

### `work-orders.spec.ts`

#### Test Cases

| Test ID | Test Name | Description | Priority |
|---------|-----------|-------------|----------|
| WO-001 | Tech can view work order list | Navigate to work orders and verify list renders | P0 |
| WO-002 | Tech can view work order details | Click work order and verify detail page loads | P0 |
| WO-003 | Checklist completion persists | Complete checklist item, refresh, verify still checked | P0 |
| WO-004 | Checklist notes can be added | Add notes to checklist item and verify saved | P1 |
| WO-005 | Parts can be added to work order | Add part from inventory to work order | P1 |
| WO-006 | Parts quantity updates inventory | Verify inventory decreases when parts used | P2 |
| WO-007 | Work order status transitions | Verify status can change: Open → In Progress → Complete | P0 |
| WO-008 | Mobile view renders correctly | Navigate on mobile viewport and verify mobile UI | P1 |
| WO-009 | Time logging starts timer | Start timer on work order and verify it increments | P1 |
| WO-010 | Time logging saves labor entry | Stop timer and verify labor entry created | P1 |

---

## Phase 3: QR Code Functionality (Priority: MEDIUM)

### `qr-codes.spec.ts`

#### Test Cases

| Test ID | Test Name | Description | Priority |
|---------|-----------|-------------|----------|
| QR-001 | Admin can access QR generator | Navigate to `/admin/qr-codes` | P0 |
| QR-002 | QR codes generate for equipment | Select equipment and generate QR code | P0 |
| QR-003 | QR codes can be printed | Verify print functionality works | P2 |
| QR-004 | QR scan opens equipment page | Navigate to scanned equipment URL | P1 |
| QR-005 | Equipment public page loads | Verify `/equipment/[code]` page works without auth | P0 |
| QR-006 | Quick ticket creation from QR | Create ticket from equipment QR page | P1 |

---

## Phase 4: Reports & Analytics (Priority: MEDIUM)

### `reports.spec.ts`

#### Test Cases

| Test ID | Test Name | Description | Priority |
|---------|-----------|-------------|----------|
| RPT-001 | Admin can access reports page | Navigate to `/admin/reports` | P0 |
| RPT-002 | Equipment analytics loads | Verify equipment analytics API returns data | P1 |
| RPT-003 | Technician analytics loads | Verify technician analytics API returns data | P1 |
| RPT-004 | Report export to CSV | Export report and verify download | P1 |
| RPT-005 | Date range filters work | Change date range and verify data updates | P1 |
| RPT-006 | Trend API returns data | Verify `/api/analytics/trends` works | P2 |

---

## Phase 5: Operator Experience (Priority: MEDIUM)

### `operator-tickets.spec.ts`

#### Test Cases

| Test ID | Test Name | Description | Priority |
|---------|-----------|-------------|----------|
| OP-001 | Operator can view my-tickets | Navigate to `/my-tickets` | P0 |
| OP-002 | Operator can create ticket | Create new ticket as operator | P0 |
| OP-003 | Operator can view ticket details | Click ticket and view details | P0 |
| OP-004 | Operator sees only their tickets | Verify operator cannot see other users' tickets | P1 |
| OP-005 | Ticket photo upload works | Upload photo to ticket | P2 |

---

## Phase 6: Dashboard & Home (Priority: LOW)

### `dashboard.spec.ts`

#### Test Cases

| Test ID | Test Name | Description | Priority |
|---------|-----------|-------------|----------|
| DASH-001 | Admin dashboard loads stats | Verify stats cards show data | P0 |
| DASH-002 | Tech dashboard shows assigned work | Verify work order feed | P0 |
| DASH-003 | Quick actions work | Click quick action buttons and verify navigation | P1 |
| DASH-004 | Work order stats accurate | Verify open/in-progress/complete counts | P2 |

---

## Implementation Order

### Sprint 1 (Immediate)
1. **IMP-001 to IMP-013** - Core import wizard tests
2. **WO-001 to WO-003** - Core work order tests

### Sprint 2 (Next)
3. **IMP-014 to IMP-019** - Import edge cases
4. **WO-004 to WO-010** - Work order enhancements
5. **QR-001 to QR-006** - QR code functionality

### Sprint 3 (Future)
6. **RPT-001 to RPT-006** - Reports & Analytics
7. **OP-001 to OP-005** - Operator experience
8. **DASH-001 to DASH-004** - Dashboard tests

---

## Test File Structure

```
e2e/
├── fixtures.ts                 # Shared login fixtures (existing)
├── fixtures/
│   └── import-data.ts         # CSV test data
├── import-wizard.spec.ts      # NEW: Import wizard tests
├── work-orders.spec.ts        # NEW: Work order tests
├── qr-codes.spec.ts           # NEW: QR code tests
├── reports.spec.ts            # NEW: Reports tests
├── operator-tickets.spec.ts   # NEW: Operator tests
├── dashboard.spec.ts          # NEW: Dashboard tests
└── ... (existing specs)
```

---

## Test Data Cleanup Strategy

For import tests, use unique test identifiers that can be cleaned up:
- Equipment codes: `EQ-E2E-*`
- Location codes: `LOC-E2E-*`
- Part SKUs: `SPR-E2E-*`
- User IDs: `USER-E2E-*`

Add a cleanup hook or API endpoint for test data removal.

---

## Running Tests

```bash
# Run all tests
bun run test:e2e

# Run specific test file
bun run test:e2e e2e/import-wizard.spec.ts

# Run with UI
bun run test:e2e --ui

# Run headed (visible browser)
bun run test:e2e --headed
```
