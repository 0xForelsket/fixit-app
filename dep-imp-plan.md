# Implementation Plan: Departmental Isolation and Task Allocation

## 1. Background & Rationale
In an industrial environment, the lack of departmental structure leads to "information noise" and operational risk. Technicians are typically specialized (e.g., a high-voltage electrician should not be filtering through hundreds of mechanical belt-replacement tickets).

### Key Problems Addressed:
*   **Information Overload**: Technicians currently see every work order in the plant, making it difficult to find relevant tasks.
*   **Accountability**: No clear "ownership" of assets by specific maintenance teams (e.g., who is responsible for the HVAC system vs. the CNC machines?).
*   **Data Security/Privacy**: Operators and Technicians should only have access to the data required for their specific role and department to prevent unauthorized modifications or data leaks.
*   **Safety**: Ensuring that tasks are routed to the team with the correct specialized skills.

## 2. Architectural Strategy: "Departmental Multi-tenancy"
We are implementing a lightweight multi-tenancy model where the `departmentId` acts as the primary partition for data visibility.

### Logic Framework:
*   **Global Access (Admins/Managers)**: Can view and manage all departments and skip department-level filters.
*   **Local Access (Technicians)**: Automatically constrained by their `SessionUser.departmentId`. Every database query initiated by a tech will include a mandatory `WHERE departmentId = ?` clause.
*   **Cross-Functional Reporting (Operators)**: Operators can see equipment globally but will report issues to a specific department (e.g., reporting a "Leaking Pipe" to the `PLUMB` department).

## 3. Implementation Steps

### 3.1. Database Schema (`src/db/schema.ts`)
- [x] **New Table `departments`**:
    - `id`: Primary Key
    - `name`: e.g., "Electrical", "Mechanical"
    - `code`: Unique identifier (ELEC, MECH, HVAC)
    - `managerId`: Links to `users.id` (Relationship-only, no hard FK to avoid circularity).
- [x] **Schema Extensions**:
    - `users.departmentId`: Assigns a user to a home team.
    - `equipment.departmentId`: Defines which team is responsible for maintenance of that asset.
    - `work_orders.departmentId`: Routes the ticket to a specific team's dashboard.
- [x] **Indexing**: Added `deptStatusIdx` on `work_orders` and `deptIdx` on `equipment` to ensure high-performance filtering.

### 3.2. Authentication & Session (`src/lib/session.ts`)
- [x] Update `SessionUser` interface.
- [ ] Modify `createSession` to query and embed the `departmentId` into the signed JWT.
- [ ] **Benefit**: This allows us to enforce departmental filtering in Server Actions without performing an extra database lookup for the user's department on every request.

### 3.3. Isolation & Filtering Logic
- [ ] **Server Action Interceptors**: Update work order fetching logic in `actions/work-orders.ts`.
    ```typescript
    // Pseudo-logic example
    const user = await getCurrentUser();
    if (user.role === 'tech') {
      query.where(eq(workOrders.departmentId, user.departmentId));
    }
    ```
- [ ] **Asset Registry**: If a tech goes to `/assets/equipment`, they should (optionally) see a view filtered by their department's responsibility by default.

### 3.4. UI & UX Refinement
- [ ] **Department Toggle**: On the main dashboards, allow Managers to toggle between "My Department" and "All Departments".
- [ ] **Forms**: 
    - Update `EquipmentForm` to include a required "Responsible Department" picker.
    - Update `WorkOrderForm` to automatically suggest a department based on the selected equipment's owner department.

## 4. Migration & Handoff
- [ ] **Migration**: `npm run db:generate` followed by `npm run db:push`.
- [x] **Seed Data**: Update `src/db/seed.ts` with industrial structure:
    - **Departments**: Assembly (`ASSY`), Molding (`MOLD`), Warehouse (`WHSE`), Facilities (`FCLT`).
    - **Users**: 1 Manager + 2-3 Technicians per department.
    - **Assets**: Link existing equipment to their responsible departments.
- [ ] **Security Audit**: Ensure that direct URL access (e.g., `/work-orders/[id]`) also checks for departmental ownership if the user is a technician.

---
**Current Status**: Schema updated. Session interface updated. Seed script updated with Assembly, Molding, Warehouse, and Facilities.
**Next Immediate Task**: Modify `createSession` in `src/lib/session.ts` and run migrations.
