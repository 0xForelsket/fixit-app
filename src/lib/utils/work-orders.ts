export function getStatusConfig(status: string) {
  const configs = {
    open: {
      label: "Open",
      color: "text-secondary-foreground",
      bg: "bg-secondary",
      border: "border-secondary-foreground/20",
    },
    in_progress: {
      label: "In Progress",
      color: "text-warning-700",
      bg: "bg-warning-500/15",
      border: "border-warning-500/30",
    },
    resolved: {
      label: "Resolved",
      color: "text-success-700",
      bg: "bg-success-500/15",
      border: "border-success-500/30",
    },
    closed: {
      label: "Closed",
      color: "text-muted-foreground",
      bg: "bg-muted",
      border: "border-border",
    },
  };

  return (
    configs[status as keyof typeof configs] || {
      label: status,
      color: "text-muted-foreground",
      bg: "bg-muted",
      border: "border-border",
    }
  );
}

export function getPriorityConfig(priority: string) {
  const configs = {
    low: {
      label: "Low",
      color: "text-muted-foreground",
      bg: "bg-muted",
      border: "border-border",
    },
    medium: {
      label: "Medium",
      color: "text-primary-700",
      bg: "bg-primary-500/10",
      border: "border-primary-500/20",
    },
    high: {
      label: "High",
      color: "text-danger-700",
      bg: "bg-danger-500/15",
      border: "border-danger-500/30",
    },
    critical: {
      label: "Critical",
      color: "text-white",
      bg: "bg-danger-600",
      border: "border-danger-700",
    },
  };

  return (
    configs[priority as keyof typeof configs] || {
      label: priority,
      color: "text-muted-foreground",
      bg: "bg-muted",
      border: "border-border",
    }
  );
}
