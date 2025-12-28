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
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "bg-danger-600 border-danger-700 text-white hover:bg-danger-700",
      href: "/report",
      description: "Submit new request",
    },
    {
      label: "My Tasks",
      icon: <ClipboardList className="h-4 w-4" />,
      color: "bg-zinc-900 border-zinc-950 text-white hover:bg-black",
      href: "/my-tickets",
      description: "View assigned jobs",
    },
    {
      label: "PM Checks",
      icon: <Wrench className="h-4 w-4" />,
      color: "bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50",
      href: "/maintenance/schedules",
      description: "Scheduled maintenance",
    },
    {
      label: "Equipment",
      icon: <MonitorCog className="h-4 w-4" />,
      color: "bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50",
      href: "/",
      description: "Browse assets",
    },
  ];

  return (
    <section>
      <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {actions.map((action, index) => (
          <Link
            key={action.label}
            href={action.href}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 transition-all active:scale-95 whitespace-nowrap",
              action.color, // Apply the color styles (bg/border/text) directly to the button
              "font-bold",
              index < 4 ? `animate-in animate-stagger-${index + 1}` : ""
            )}
          >
            {/* Remove inner container styles to simply show the icon */}
            {action.icon}
            <span className="text-sm">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
