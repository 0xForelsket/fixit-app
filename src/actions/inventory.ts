// DEPRECATED: This file re-exports from the new modular structure
// Import from "@/actions/inventory" for new code

export {
  consumeWorkOrderPartAction,
  createTransactionAction,
  importPartsFromCSV,
} from "./inventory/index";

export type {
  PartImportResult,
  PartImportRow,
  PartImportRowResult,
} from "./inventory/index";
