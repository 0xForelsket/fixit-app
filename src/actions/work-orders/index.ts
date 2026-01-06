// Work Order Actions - Barrel Export
// All work order server actions are split into logical modules

// Creation
export { createWorkOrder } from "./create";

// Updates and comments
export { addWorkOrderComment, updateChecklistItem, updateWorkOrder } from "./update";

// Resolution
export { resolveWorkOrder } from "./resolve";

// Bulk operations
export { bulkUpdateWorkOrders, duplicateWorkOrder } from "./bulk";
export type { BulkUpdateData } from "./bulk";

// Quick actions (one-click operations)
export { assignToMe, quickResolveWorkOrder, startWorkOrder } from "./quick-actions";
