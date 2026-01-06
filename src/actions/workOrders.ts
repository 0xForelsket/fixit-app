// DEPRECATED: This file re-exports from the new modular structure
// Import from "@/actions/work-orders" for new code

export {
  addWorkOrderComment,
  assignToMe,
  bulkUpdateWorkOrders,
  createWorkOrder,
  duplicateWorkOrder,
  quickResolveWorkOrder,
  resolveWorkOrder,
  startWorkOrder,
  updateChecklistItem,
  updateWorkOrder,
} from "./work-orders";

export type { BulkUpdateData } from "./work-orders";
