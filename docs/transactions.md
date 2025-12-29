# Database Transaction Guidelines

This document outlines the transaction isolation and concurrency patterns used in the FixIt CMMS application.

## Current Database

The application uses **SQLite** (via better-sqlite3) in development and may migrate to **PostgreSQL** in production.

### SQLite Transaction Behavior

SQLite uses **SERIALIZABLE** isolation by default, which provides the strongest guarantees:
- Prevents dirty reads, non-repeatable reads, and phantom reads
- Transactions are fully isolated from each other
- Write operations are serialized (one at a time)

This is ideal for our use case where data integrity is paramount.

## Transaction Usage Patterns

### 1. Work Order Creation (`src/actions/workOrders.ts`)

**Purpose:** Ensure work order and attachments are created atomically.

```typescript
await db.transaction(async (tx) => {
  // Insert work order
  const [newWorkOrder] = await tx.insert(workOrders).values({...}).returning();
  
  // Insert attachments if any
  if (attachments.length > 0) {
    await tx.insert(attachments).values([...]);
  }
  
  return newWorkOrder;
});
```

**Isolation Requirements:**
- Must be atomic: either all data is saved or none
- Attachments must reference the work order ID
- No partial work orders should exist in the database

### 2. Inventory Transactions (`src/actions/inventory.ts`)

**Purpose:** Maintain inventory level consistency across transfers and adjustments.

```typescript
await db.transaction(async (tx) => {
  // Read current levels
  const sourceLevel = await tx.query.inventoryLevels.findFirst({...});
  
  // Calculate new quantities
  const newQty = currentQty - validated.quantity;
  
  // Validate (no negative stock)
  if (newQty < 0) throw new Error("Insufficient stock");
  
  // Update source location
  await tx.update(inventoryLevels).set({...});
  
  // For transfers: update target location
  if (validated.type === 'transfer') {
    await tx.update(inventoryLevels).set({...});
  }
  
  // Record transaction log
  await tx.insert(inventoryTransactions).values({...});
});
```

**Isolation Requirements:**
- **Critical:** Stock levels must be consistent (no negative inventory)
- Read-then-write pattern requires isolation to prevent race conditions
- Transfer operations must update both locations atomically

### 3. Scheduler Work Order Generation (`src/app/api/scheduler/run/route.ts`)

**Purpose:** Generate work orders from maintenance schedules atomically.

```typescript
await db.transaction(async (tx) => {
  // Create work order
  const [newWorkOrder] = await tx.insert(workOrders).values({...}).returning();
  
  // Copy checklist items
  await tx.insert(checklistCompletions).values([...]);
  
  // Update schedule next due date
  await tx.update(maintenanceSchedules).set({
    lastGenerated: now,
    nextDue: nextDueDate,
  });
});
```

**Isolation Requirements:**
- Work order, checklists, and schedule update must be atomic
- Schedule must not be processed twice if transaction fails

## Migration Considerations (PostgreSQL)

When migrating to PostgreSQL, consider the following:

### Isolation Level Comparison

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read | Use Case |
|----------------|------------|---------------------|--------------|----------|
| READ UNCOMMITTED | Yes | Yes | Yes | Never use |
| READ COMMITTED | No | Yes | Yes | Default in PG |
| REPEATABLE READ | No | No | Yes | Financial data |
| SERIALIZABLE | No | No | No | Critical inventory |

### Recommended Changes

1. **Inventory Transactions:** Should use `SERIALIZABLE` to prevent race conditions
   ```typescript
   await db.transaction(async (tx) => {...}, { isolationLevel: 'serializable' });
   ```

2. **Work Order Creation:** `READ COMMITTED` is sufficient (no read-then-write pattern)

3. **Scheduler:** `SERIALIZABLE` recommended to prevent duplicate work order generation

### Drizzle ORM Transaction Options

Drizzle ORM supports explicit isolation levels for PostgreSQL:

```typescript
await db.transaction(
  async (tx) => {
    // transaction code
  },
  {
    isolationLevel: 'serializable', // or 'read committed', 'repeatable read'
    accessMode: 'read write',
  }
);
```

## Concurrency Testing

Before production deployment, test these scenarios:

1. **Concurrent Inventory Deductions:**
   - Two users try to consume the same part simultaneously
   - Expected: One succeeds, other fails with "Insufficient stock"

2. **Concurrent Schedule Processing:**
   - Cron job runs while admin triggers manual run
   - Expected: Each schedule only generates one work order

3. **Work Order Assignment Race:**
   - Two techs try to assign themselves to same work order
   - Expected: Clear winner, no duplicate assignments

## Error Handling

All transaction failures should:
1. Automatically rollback (Drizzle handles this)
2. Log the error with context
3. Return a user-friendly error message
4. Not leak implementation details

Example pattern:
```typescript
try {
  await db.transaction(async (tx) => {
    // ... operations
  });
} catch (error) {
  apiLogger.error({ requestId, error }, "Transaction failed");
  return ApiErrors.internal(error, requestId);
}
```
