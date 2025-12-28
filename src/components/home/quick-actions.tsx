import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ClipboardList,
  FileText,
  MonitorCog,
  Package,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  const actions = [
    {
      label: "Work Requests",
      icon: <AlertTriangle />,
      color: "bg-blue-50 text-blue-600",
      href: "/report",
    },
    {
      label: "Work Order",
      icon: <ClipboardList />,
      color: "bg-orange-50 text-orange-600",
      href: "/my-tickets",
    },
    {
      label: "PM",
      icon: <Wrench />,
      color: "bg-green-50 text-green-600",
      href: "/maintenance/schedules",
    },
    {
      label: "Vendor",
      icon: <Users />,
      color: "bg-yellow-50 text-yellow-600",
      href: "/admin/users",
    },
    {
      label: "Equipment",
      icon: <MonitorCog />,
      color: "bg-purple-50 text-purple-600",
      href: "/assets/equipment",
    },
    {
      label: "Inventory",
      icon: <Package />,
      color: "bg-indigo-50 text-indigo-600",
      href: "/assets/inventory",
    },
    {
      label: "Work Permit",
      icon: <FileText />,
      color: "bg-red-50 text-red-600",
      href: "/reports",
    },
    {
      label: "Legal",
      icon: <ShieldCheck />,
      color: "bg-sky-50 text-sky-600",
      href: "/",
    },
  ];

  return (
    <section>
      <div className="grid grid-cols-4 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
          >
            <div
              className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all",
                action.color
              )}
            >
              {action.icon}
            </div>
            <span className="text-[10px] font-bold text-center leading-tight text-zinc-600">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
