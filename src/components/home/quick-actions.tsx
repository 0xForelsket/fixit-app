import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ClipboardList,
  MonitorCog,
  Wrench,
} from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  const actions = [
    {
      label: "Report Issue",
      icon: <AlertTriangle className="h-8 w-8" />,
      color: "text-danger-600 bg-danger-50 border-danger-100",
      href: "/report",
      description: "Submit new request",
    },
    {
      label: "My Tasks",
      icon: <ClipboardList className="h-8 w-8" />,
      color: "text-primary-600 bg-primary-50 border-primary-100",
      href: "/my-tickets",
      description: "View assigned jobs",
    },
    {
      label: "PM Checks",
      icon: <Wrench className="h-8 w-8" />,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      href: "/maintenance/schedules",
      description: "Scheduled maintenance",
    },
    {
      label: "Equipment",
      icon: <MonitorCog className="h-8 w-8" />,
      color: "text-zinc-600 bg-zinc-50 border-zinc-200",
      href: "/",
      description: "Browse assets",
    },
  ];

  return (
    <section>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {actions.map((action, index) => (
          <Link
            key={action.label}
            href={action.href}
            className={cn(
              "relative flex flex-col items-center justify-center gap-3 rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-95 group",
              "bg-white border-zinc-200", // Default bg
              index < 4 ? `animate-stagger-${index + 1} animate-in fade-in` : ""
            )}
          >
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-xl transition-colors",
                action.color
              )}
            >
              {action.icon}
            </div>
            <div className="text-center space-y-0.5">
              <span className="block text-sm font-bold text-zinc-900 group-hover:text-primary-600 transition-colors">
                {action.label}
              </span>
              <span className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
                {action.description}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
