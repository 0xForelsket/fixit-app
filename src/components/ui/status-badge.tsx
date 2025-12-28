import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
  showIcon?: boolean;
}

const STATUS_MAP: Record<
  string,
  {
    variant:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | "success"
      | "warning"
      | "danger"
      | "critical";
    label?: string;
    icon?: React.ElementType;
  }
> = {
  // Work Order Status
  open: { variant: "default", label: "Open", icon: AlertTriangle },
  in_progress: { variant: "warning", label: "In Progress", icon: Clock },
  resolved: { variant: "success", label: "Resolved", icon: CheckCircle2 },
  closed: { variant: "secondary", label: "Closed", icon: XCircle },

  // Priorities
  low: { variant: "secondary", label: "Low" },
  medium: { variant: "warning", label: "Medium" },
  high: { variant: "danger", label: "High" },
  critical: { variant: "critical", label: "Critical" },

  // Equipment Status
  operational: { variant: "success", label: "Operational" },
  down: { variant: "danger", label: "Down" },
  maintenance: { variant: "warning", label: "Maintenance" },

  // Generic
  active: { variant: "success", label: "Active" },
  inactive: { variant: "secondary", label: "Inactive" },
};

export function StatusBadge({
  status,
  className,
  showIcon = false,
}: StatusBadgeProps) {
  if (!status) {
    return (
      <Badge
        variant="secondary"
        className={cn("capitalize whitespace-nowrap", className)}
      >
        Unknown
      </Badge>
    );
  }

  const normalizedStatus = status.toLowerCase();
  const config = STATUS_MAP[normalizedStatus] || {
    variant: "secondary",
    label: status,
  };
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn("capitalize whitespace-nowrap", className)}
    >
      {showIcon && Icon && <Icon className="mr-1 h-3 w-3" />}
      {config.label || status.replace(/_/g, " ")}
    </Badge>
  );
}
