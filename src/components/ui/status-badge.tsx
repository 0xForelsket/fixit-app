import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  XCircle,
} from "lucide-react";

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
  showIcon?: boolean; // Forces icon if available
  pulse?: boolean; // Forces pulse animation
}

// 1. Define the config shape for better type safety
interface StatusConfig {
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
  showDot?: boolean; // For "Equipment" style (Colored dot instead of icon)
  animate?: boolean; // For "Down" or "Critical" pulsing
}

const STATUS_MAP: Record<string, StatusConfig> = {
  // --- Work Order Status (Icon based) ---
  open: {
    variant: "secondary", // Usually grey/neutral until picked up
    label: "Open",
    icon: AlertTriangle,
  },
  in_progress: {
    variant: "warning",
    label: "In Progress",
    icon: Clock,
  },
  resolved: {
    variant: "success",
    label: "Resolved",
    icon: CheckCircle2,
  },
  closed: {
    variant: "outline",
    label: "Closed",
    icon: XCircle,
  },

  // --- Priorities (Intensity based) ---
  low: { variant: "secondary", label: "Low" },
  medium: { variant: "warning", label: "Medium" },
  high: { variant: "danger", label: "High" },
  critical: {
    variant: "critical", // Uses the glow variant we made earlier
    label: "Critical",
    icon: AlertOctagon,
    animate: true,
  },

  // --- Equipment Status (Dot based) ---
  operational: {
    variant: "outline", // Outline container + Green dot
    label: "Operational",
    showDot: true,
    icon: CheckCircle2,
  },
  maintenance: {
    variant: "outline", // Outline container + Orange dot
    label: "Maintenance",
    showDot: true,
    icon: Wrench,
  },
  down: {
    variant: "danger", // Full red background for visibility
    label: "Line Down", // Updated label to match screenshot
    showDot: true,
    animate: true,
    icon: AlertTriangle,
  },

  // --- Generic ---
  active: { variant: "success", label: "Active", showDot: true },
  inactive: { variant: "secondary", label: "Inactive" },
};

export function StatusBadge({
  status,
  className,
  showIcon = false,
  pulse = false,
}: StatusBadgeProps) {
  // Handle null/undefined/empty
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
  // Fallback if status isn't found in map
  const config = STATUS_MAP[normalizedStatus] || {
    variant: "secondary",
    label: status,
  };

  const Icon = config.icon;
  const shouldAnimate = pulse || config.animate;

  // Determine Dot Color based on variant (Tailwind classes)
  const getDotColor = (variant: string) => {
    switch (variant) {
      case "success":
        return "bg-success-500";
      case "warning":
        return "bg-warning-500";
      case "danger":
        return "bg-danger-500";
      case "critical":
        return "bg-white";
      default:
        return "bg-muted-foreground";
    }
  };

  // Specific logic: If the main badge is an 'outline', the dot provides the color.
  // If the main badge is solid (like 'danger'), the dot might need to be white.
  const dotColorClass =
    config.variant === "danger" || config.variant === "critical"
      ? "bg-white"
      : getDotColor(
          config.variant === "outline"
            ? getMappedVariantForOutline(normalizedStatus)
            : config.variant
        );

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "capitalize whitespace-nowrap gap-1.5", // gap for icon/dot spacing
        shouldAnimate &&
          config.variant === "critical" &&
          "animate-pulse shadow-glow-danger", // Whole badge pulse
        className
      )}
    >
      {/* 1. Icon Render */}
      {showIcon && Icon && <Icon className="h-3.5 w-3.5" />}

      {/* 2. Dot Render (Equipment Style) */}
      {!showIcon && config.showDot && (
        <span className="relative flex h-2 w-2 mr-0.5">
          {shouldAnimate && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                dotColorClass
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              dotColorClass
            )}
          />
        </span>
      )}

      {/* 3. Text Label */}
      <span>{config.label || status.replace(/_/g, " ")}</span>
    </Badge>
  );
}

// Helper: map specific statuses to colors when using "outline" variant
function getMappedVariantForOutline(status: string) {
  if (status === "operational" || status === "active") return "success";
  if (status === "maintenance") return "warning";
  return "default";
}
