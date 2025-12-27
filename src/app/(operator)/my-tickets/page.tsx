import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { cn, formatRelativeTime } from "@/lib/utils";
import { eq } from "drizzle-orm";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  History,
  Inbox,
  LayoutList,
  Timer,
  Wrench,
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
    <div className="min-h-screen bg-zinc-50/50 industrial-grid py-8 pb-24 lg:pb-8">
      <div className="container mx-auto max-w-5xl px-4 space-y-8">
        {/* Success toast */}
        {showSuccess && <SuccessToast />}

        {/* Page header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight uppercase">
              My <span className="text-primary-600">Tickets</span>
            </h1>
            <p className="text-zinc-500 mt-1 text-sm font-medium">
              Track the status of issues you've reported
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 sm:pb-0">
            <StatCard
              label="Open"
              count={openWorkOrders.filter((t) => t.status === "open").length}
              type="open"
            />
            <StatCard
              label="Active"
              count={
                openWorkOrders.filter((t) => t.status === "in_progress").length
              }
              type="in_progress"
            />
            <StatCard
              label="Resolved"
              count={resolvedWorkOrders.length}
              type="resolved"
            />
          </div>
        </div>

        {/* Empty state */}
        {userWorkOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 border">
              <Inbox className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="mt-4 text-xl font-black text-zinc-900">No tickets found</h3>
            <p className="mt-2 text-zinc-500 max-w-xs mx-auto text-sm">
              You haven't reported any equipment issues yet.
            </p>
            <Button asChild className="mt-6 rounded-xl font-bold">
              <Link href="/">Report an Issue</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active work orders */}
            {openWorkOrders.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Timer className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-black uppercase tracking-tight">Active Requests</h2>
                </div>
                <div className="grid gap-3">
                  {openWorkOrders.map((workOrder) => (
                    <WorkOrderListItem key={workOrder.id} workOrder={workOrder} />
                  ))}
                </div>
              </div>
            )}

            {/* Resolved work orders */}
            {resolvedWorkOrders.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <History className="h-5 w-5 text-zinc-400" />
                  <h2 className="text-lg font-black uppercase tracking-tight text-zinc-500">
                    Recently Resolved
                  </h2>
                </div>
                <div className="grid gap-3 opacity-80 hover:opacity-100 transition-opacity">
                  {resolvedWorkOrders.map((workOrder) => (
                    <WorkOrderListItem
                      key={workOrder.id}
                      workOrder={workOrder}
                      isResolved
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
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
      color: "text-primary-700",
      bg: "bg-primary-50",
      border: "border-primary-200",
      icon: LayoutList,
    },
    in_progress: {
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: Wrench,
    },
    resolved: {
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: CheckCircle2,
    },
  }[type];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border-2 px-4 py-2 bg-white shadow-sm",
        config.border
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          config.bg
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          {label}
        </p>
        <p className={cn("text-lg font-bold leading-none", config.color)}>
          {count}
        </p>
      </div>
    </div>
  );
}

function WorkOrderListItem({
  workOrder,
  isResolved,
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
}) {
  const priorityConfig = {
    low: { color: "bg-slate-400", label: "Low" },
    medium: { color: "bg-primary-500", label: "Medium" },
    high: { color: "bg-amber-500", label: "High" },
    critical: { color: "bg-rose-600", label: "Critical" },
  }[workOrder.priority as string] || {
    color: "bg-slate-400",
    label: workOrder.priority,
  };

  return (
    <Link
      href={`/my-tickets/${workOrder.id}`}
      className={cn(
        "group relative flex items-center gap-4 overflow-hidden rounded-2xl border-2 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-md active:scale-[0.98]",
        isResolved && "grayscale-[0.5]"
      )}
    >
      {/* Priority Strip */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1.5",
          isResolved ? "bg-slate-200" : priorityConfig.color
        )}
      />

      <div className="ml-2 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-lg">
            #{workOrder.id}
          </span>
          <span className="font-bold text-zinc-900 group-hover:text-primary-700 transition-colors">
            {workOrder.title}
          </span>
          {workOrder.status === "in_progress" && (
            <Badge variant="warning" className="ml-auto sm:ml-2">
              IN PROGRESS
            </Badge>
          )}
          {workOrder.status === "resolved" && (
            <Badge variant="success" className="ml-auto sm:ml-2">
              RESOLVED
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5" />
            <span className="font-semibold text-zinc-700">
              {workOrder.equipment?.name ?? "Unknown"}
            </span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatRelativeTime(workOrder.createdAt)}
          </div>
          {workOrder.assignedTo && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1.5 text-primary-700 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {workOrder.assignedTo.name} is working on it
              </div>
            </>
          )}
        </div>
      </div>

      <div className="text-zinc-300 transition-all group-hover:translate-x-1 group-hover:text-primary-600">
        <ArrowRight className="h-5 w-5" />
      </div>
    </Link>
  );
}
