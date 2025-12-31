import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date for display
export function formatDate(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date * 1000) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format datetime for display
export function formatDateTime(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date * 1000) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date * 1000) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

// Format duration (e.g., "2h 30m")
export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

// Get priority color class
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "critical":
      return "bg-danger-600 text-white";
    case "high":
      return "bg-warning-500 text-white";
    case "medium":
      return "bg-primary-500 text-white";
    case "low":
      return "bg-primary-100 text-primary-700";
    default:
      return "bg-primary-100 text-primary-600";
  }
}

// Get status color class
export function getStatusColor(status: string): string {
  switch (status) {
    case "open":
      return "bg-primary-100 text-primary-700";
    case "in_progress":
      return "bg-warning-100 text-warning-800";
    case "resolved":
      return "bg-success-100 text-success-800";
    case "closed":
      return "bg-primary-200 text-primary-700";
    default:
      return "bg-primary-100 text-primary-600";
  }
}

// Get equipment status color class (for badges)
export function getEquipmentStatusColor(status: string): string {
  switch (status) {
    case "operational":
      return "bg-success-500";
    case "down":
      return "bg-danger-500";
    case "maintenance":
      return "bg-warning-500";
    default:
      return "bg-primary-400";
  }
}

// Get equipment status badge color class (for larger badges with text)
export function getEquipmentStatusBadgeColor(status: string): string {
  switch (status) {
    case "operational":
      return "bg-success-100 text-success-800 border-success-300";
    case "down":
      return "bg-danger-100 text-danger-800 border-danger-300";
    case "maintenance":
      return "bg-warning-100 text-warning-800 border-warning-300";
    default:
      return "bg-primary-100 text-primary-700 border-primary-300";
  }
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

// Generate a simple ID for client-side use
export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

/**
 * Result type for safeJsonParse
 */
export type JsonParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Safely parse JSON with optional Zod schema validation.
 *
 * Always wraps JSON.parse in try/catch to prevent crashes from malformed input.
 *
 * @param json - The JSON string to parse
 * @param schema - Optional Zod schema for validation
 * @returns Result object with success boolean and data/error
 *
 * @example
 * // Basic parsing
 * const result = safeJsonParse<MyType>(jsonString);
 * if (result.success) {
 *   console.log(result.data);
 * }
 *
 * @example
 * // With Zod validation
 * const result = safeJsonParse(jsonString, myZodSchema);
 * if (result.success) {
 *   // result.data is typed and validated
 * }
 */
export function safeJsonParse<T>(
  json: string | null | undefined,
  schema?: {
    safeParse: (data: unknown) => {
      success: boolean;
      data?: T;
      error?: { message: string };
    };
  }
): JsonParseResult<T> {
  if (!json) {
    return { success: false, error: "No input provided" };
  }

  try {
    const parsed: unknown = JSON.parse(json);

    if (schema) {
      const validated = schema.safeParse(parsed);
      if (!validated.success) {
        return {
          success: false,
          error: validated.error?.message || "Validation failed",
        };
      }
      return { success: true, data: validated.data as T };
    }

    return { success: true, data: parsed as T };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof SyntaxError
          ? "Invalid JSON format"
          : "Failed to parse JSON",
    };
  }
}

/**
 * Parse JSON or return a default value on failure.
 *
 * @param json - The JSON string to parse
 * @param defaultValue - Value to return if parsing fails
 * @returns Parsed value or default
 */
export function safeJsonParseOrDefault<T>(
  json: string | null | undefined,
  defaultValue: T
): T {
  const result = safeJsonParse<T>(json);
  return result.success ? result.data : defaultValue;
}

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: "accurate" | "normal";
  } = {}
) {
  const { decimals = 0, sizeType = "normal" } = opts;

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const accurateSizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(decimals)} ${
    sizeType === "accurate"
      ? (accurateSizes[i] ?? "Bytest")
      : (sizes[i] ?? "Bytes")
  }`;
}
