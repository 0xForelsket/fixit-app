/**
 * Service Layer
 *
 * This layer encapsulates database access and business logic,
 * providing a clean API for server actions and API routes.
 *
 * Benefits:
 * - Decouples business logic from database implementation
 * - Makes testing easier (mock services instead of DB)
 * - Centralizes query patterns and reduces duplication
 * - Enables caching at the service level
 */

// Work Orders Service
export {
	type WorkOrderFilters,
	type WorkOrderWithRelations,
	type CreateWorkOrderData,
	getWorkOrders,
	getWorkOrderById,
	getWorkOrderByDisplayId,
	getWorkOrderStats,
	getWorkOrdersAssignedTo,
	getRecentWorkOrders,
	createWorkOrderRecord,
	updateWorkOrderRecord,
	assignWorkOrder,
	resolveWorkOrderRecord,
	closeWorkOrderRecord,
	addWorkOrderLog,
	getWorkOrderLogs,
	getWorkOrderChecklist,
	updateChecklistCompletion,
} from "./work-orders";

// Equipment Service
export {
	type EquipmentFilters,
	type CreateEquipmentData,
	getEquipmentList,
	getEquipmentById,
	getEquipmentByCode,
	getEquipmentStats,
	getEquipmentForSelect,
	getEquipmentChildren,
	createEquipmentRecord,
	updateEquipmentRecord,
	updateEquipmentStatus,
	deleteEquipmentRecord,
	getEquipmentCategories,
	getEquipmentTypes,
	getEquipmentModels,
	getEquipmentModelById,
	getEquipmentMeters,
	recordMeterReading,
	createEquipmentMeter,
	updateEquipmentMeter,
	deleteEquipmentMeter,
} from "./equipment";

// Inventory Service
export {
	type SparePartFilters,
	type CreateSparePartData,
	getSpareParts,
	getSparePartById,
	getSparePartBySku,
	getLowStockParts,
	getInventoryStats,
	createSparePartRecord,
	updateSparePartRecord,
	deleteSparePartRecord,
	getInventoryLevel,
	upsertInventoryLevel,
	adjustInventoryLevel,
	getInventoryTransactions,
	getVendors,
	getVendorById,
	createVendorRecord,
	updateVendorRecord,
	deleteVendorRecord,
} from "./inventory";

// Users Service
export {
	type UserFilters,
	type CreateUserData,
	getUsers,
	getUserById,
	getUserByEmployeeId,
	getUsersForSelect,
	getTechnicians,
	getUserStats,
	createUserRecord,
	updateUserRecord,
	deactivateUser,
	activateUser,
	getRoles,
	getRoleById,
	getRoleByName,
	createRoleRecord,
	updateRoleRecord,
	deleteRoleRecord,
} from "./users";

// Common types
export interface PaginationOptions {
	page: number;
	pageSize: number;
}

export interface SortOptions {
	field: string;
	direction: "asc" | "desc";
}
