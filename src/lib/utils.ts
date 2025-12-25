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

// Get machine status color class (for badges)
export function getMachineStatusColor(status: string): string {
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

// Get machine status badge color class (for larger badges with text)
export function getMachineStatusBadgeColor(status: string): string {
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
