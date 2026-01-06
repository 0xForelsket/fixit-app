// Department Actions - Barrel Export

// Query functions (read-only, accessible to all authenticated users)
export {
  getDepartment,
  getDepartments,
  getDepartmentsWithStats,
  getDepartmentWithDetails,
} from "./queries";

// Mutation functions (require SYSTEM_SETTINGS permission)
export {
  createDepartment,
  deleteDepartment,
  updateDepartment,
} from "./mutations";
