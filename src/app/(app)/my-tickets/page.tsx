import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { cn, formatRelativeTime } from "@/lib/utils";
import { eq } from "drizzle-orm";
import {
  ArrowRight,
  Clock,
  History,
  Inbox,
  MonitorCog,
  Timer,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SuccessToast } from "./success-toast";

interface PageProps {
  searchParams: Promise<{ created?: string }>;
}

export default async function MyWorkOrdersPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const showSuccess = params.created === "true";

  // Fetch user's work orders
  const userWorkOrders = await db.query.workOrders.findMany({
    where: eq(workOrders.reportedById, user.id),
    orderBy: (workOrders, { desc }) => [desc(workOrders.createdAt)],
    with: {
      equipment: {
        columns: {
          id: true,
          name: true,
          code: true,
        },
      },
      assignedTo: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Group by status
  const openWorkOrders = userWorkOrders.filter(
    (t) => t.status === "open" || t.status === "in_progress"
  );
  const resolvedWorkOrders = userWorkOrders.filter(
    (t) => t.status === "resolved" || t.status === "closed"
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Success toast */}
      {showSuccess && <SuccessToast />}

      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight uppercase">
            My <span className="text-primary-600">Tickets</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Track the status of issues you've reported
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none sm:pb-0">
          <StatTickerCard
            label="Open"
            count={openWorkOrders.filter((t) => t.status === "open").length}
            type="open"
          />
          <StatTickerCard
            label="Active"
            count={
              openWorkOrders.filter((t) => t.status === "in_progress").length
            }
            type="in_progress"
          />
          <StatTickerCard
            label="Resolved"
            count={resolvedWorkOrders.length}
            type="resolved"
          />
        </div>
      </div>

      {/* Main Content */}
      {userWorkOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-zinc-200 shadow-sm">
          <EmptyState
            title="No tickets found"
            description="You haven't reported any equipment issues yet. Keep the floor running smoothly by reporting identified defects."
            icon={Inbox}
            action={{
              label: "Report an Issue",
              href: "/",
            }}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active work orders */}
          {openWorkOrders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Timer className="h-4 w-4 text-primary-600" />
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                  Active Requests
                </h2>
              </div>
              <div className="flex flex-col gap-2">
                {openWorkOrders.map((workOrder, index) => (
                  <WorkOrderListItem
                    key={workOrder.id}
                    workOrder={workOrder}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Resolved work orders */}
          {resolvedWorkOrders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <History className="h-4 w-4 text-zinc-400" />
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                  Recently Resolved
                </h2>
              </div>
              <div className="flex flex-col gap-2 opacity-80 hover:opacity-100 transition-opacity">
                {resolvedWorkOrders.map((workOrder, index) => (
                  <WorkOrderListItem
                    key={workOrder.id}
                    workOrder={workOrder}
                    isResolved
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatTickerCard({
  label,
  count,
  type,
}: {
  label: string;
  count: number;
  type: "open" | "in_progress" | "resolved";
}) {
  const config = {
    open: {
      color: "text-zinc-600",
      dot: "bg-zinc-400",
      bg: "bg-zinc-100",
    },
    in_progress: {
      color: "text-amber-700",
      dot: "bg-amber-500",
      bg: "bg-amber-50",
    },
    resolved: {
      color: "text-emerald-700",
      dot: "bg-emerald-500",
      bg: "bg-emerald-50",
    },
  }[type];

  return (
    <div className={cn(
      "flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 shadow-sm min-w-[100px]",
      type === 'in_progress' && count > 0 && "border-amber-200"
    )}>
      <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot, count > 0 && "animate-pulse")} />
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-0.5">
          {label}
        </span>
        <span className={cn("text-sm font-black leading-none", count > 0 ? config.color : "text-zinc-300")}>
          {count}
        </span>
      </div>
    </div>
  );
}

function WorkOrderListItem({
  workOrder,
  isResolved,
  index,
}: {
  workOrder: {
    id: number;
    title: string;
    priority: string;
    status: string;
    createdAt: Date;
    equipment: { id: number; name: string; code: string } | null;
    assignedTo: { id: number; name: string } | null;
  };
  isResolved?: boolean;
  index: number;
}) {
  const staggerClass =
    index < 10
      ? `animate-stagger-${index + 1}`
      : "animate-in fade-in duration-500";

  const priorityColors = {
    low: "bg-slate-400",
    medium: "bg-primary-500",
    high: "bg-amber-500",
    critical: "bg-rose-600",
  }[workOrder.priority] || "bg-zinc-300";

  return (
    <Link
      href={`/my-tickets/${workOrder.id}`}
      className={cn(
        "group relative flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-md active:scale-[0.98] cursor-pointer animate-in fade-in slide-in-from-bottom-1",
        isResolved && "opacity-75 grayscale-[0.2]",
        staggerClass
      )}
    >
      {/* Subtle priority indicator */}
      <div className={cn(
        "absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all group-hover:top-2 group-hover:bottom-2",
        isResolved ? "bg-zinc-200" : priorityColors
      )} />

      <div className="min-w-0 flex-1 pl-2 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-black text-zinc-400 bg-zinc-100 px-1 rounded uppercase">
            #{workOrder.id}
          </span>
          <h3 className="font-bold text-sm text-zinc-900 leading-tight truncate group-hover:text-primary-700 transition-colors">
            {workOrder.title}
          </h3>
        </div>

        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-zinc-500">
          <div className="flex items-center gap-1">
            <MonitorCog className="h-3 w-3 shrink-0 text-zinc-400" />
            <span className="text-zinc-700 font-bold truncate max-w-[150px]">
              {workOrder.equipment?.name || "Unassigned"}
            </span>
          </div>
          <span className="text-zinc-300">•</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            {formatRelativeTime(workOrder.createdAt)}
          </div>
          {workOrder.assignedTo && !isResolved && (
            <>
              <span className="text-zinc-300">•</span>
              <div className="flex items-center gap-1 text-primary-600">
                <UserIcon className="h-3 w-3 shrink-0" />
                <span className="font-bold">{workOrder.assignedTo.name}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <StatusBadge status={workOrder.status} showIcon />
        <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-primary-500 transition-colors group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
