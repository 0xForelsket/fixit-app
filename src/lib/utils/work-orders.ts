export function getStatusConfig(status: string) {
  const configs = {
    open: {
      label: "Open",
      color: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    in_progress: {
      label: "In Progress",
      color: "text-purple-700",
      bg: "bg-purple-50",
      border: "border-purple-200",
    },
    resolved: {
      label: "Resolved",
      color: "text-green-700",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    closed: {
      label: "Closed",
      color: "text-slate-700",
      bg: "bg-slate-50",
      border: "border-slate-200",
    },
  };

  return (
    configs[status as keyof typeof configs] || {
      label: status,
      color: "text-gray-700",
      bg: "bg-gray-50",
      border: "border-gray-200",
    }
  );
}

export function getPriorityConfig(priority: string) {
  const configs = {
    low: {
      label: "Low",
      color: "text-slate-700",
      bg: "bg-slate-100",
      border: "border-slate-200",
    },
    medium: {
      label: "Medium",
      color: "text-blue-700",
      bg: "bg-blue-100",
      border: "border-blue-200",
    },
    high: {
      label: "High",
      color: "text-orange-700",
      bg: "bg-orange-100",
      border: "border-orange-200",
    },
    critical: {
      label: "Critical",
      color: "text-red-700",
      bg: "bg-red-100",
      border: "border-red-200",
    },
  };

  return (
    configs[priority as keyof typeof configs] || {
      label: priority,
      color: "text-gray-700",
      bg: "bg-gray-100",
      border: "border-gray-200",
    }
  );
}
