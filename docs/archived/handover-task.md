# Handover Task: PostgreSQL Migration & UUID Transition

## Objective
Migrate the `fixit-app` from SQLite to PostgreSQL and transition all Primary Keys from auto-incrementing integers to UUIDv7 (strings) to support future Offline PWA capabilities.

## Completed Work
1.  **Infrastructure:**
    *   Added PostgreSQL 16 container to `docker-compose.yml`.
    *   Configured port `5433` to avoid conflicts with local Postgres.
    *   Updated `.env` and `drizzle.config.ts`.
2.  **Database Layer:**
    *   Rewrote `src/db/schema.ts` to use `pgTable`.
    *   All tables now use `id: text("id").primaryKey().$defaultFn(() => uuidv7())`.
    *   Added `displayId: serial("display_id")` for human-readable references.
    *   Successfully pushed schema to DB (`bun db:push`).
    *   Updated `src/db/seed.ts` and successfully seeded the DB (`bun db:seed`).
    *   Recently switched from `drizzle-orm/bun-sql` to `drizzle-orm/postgres-js` for better build compatibility.
3.  **Type System & Server Actions:**
    *   Updated `SessionUser` interface in `src/lib/session.ts` to use string IDs.
    *   Updated Zod schemas in `src/lib/validations/`.
    *   **Finished** updating almost all Server Actions in `src/actions/`: `attachments.ts`, `equipment.ts`, `workOrders.ts`, `users.ts`, `roles.ts`, `costs.ts`, `departments.ts`, `downtime.ts`, `favorites.ts`, `maintenance.ts`, `vendors.ts`, `workOrderTemplates.ts`.
4.  **API Routes:**
    *   Updated major routes in `src/app/(app)/api/` including: `equipment`, `labor`, `notifications`, `search`, `scheduler`, and `import`. Parameters are now treated as strings.
    *   **Fixed** Analytics APIs (`trends`, `kpis`, `technicians`, `equipment`) to use Postgres-compatible date logic and type casting for `bigint` counts.
5.  **UI & Pages:**
    *   Migrated several key views and components: Dashboard, Home, Equipment details, Maintenance schedules, and Work order details.
    *   Updated props and state in components like `EquipmentGrid`, `ScheduleForm`, `WorkOrderTabs`, etc., to use string IDs.

## Current Status
*   **Database:** Functional and seeded with comprehensive dataset (27 users, 28 equipment, 12 work orders, etc.).
*   **Build:** **PASSING** (0 errors).
*   **Tests:** All tests updated and operational.

## Remaining Tasks
1.  **Manual Verification:**
    *   Run the app and manually test critical flows (login, work order creation, equipment management) to ensure runtime behavior matches types.
2.  **Deployment Prep:**
    *   Prepare for deployment or merge into main branch.

## Crucial Note
Stick to **UUIDv7** for consistency. Use `displayId` for human-readable output, but use the UUID `id` for all lookups, database relations, and API parameters. Avoid `Number.parseInt()` on ID fields.
