import { StatusBadge } from "@/components/ui/status-badge";
import { PrintButton } from "@/components/work-orders/print-button";
import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { formatTimeRemaining, getUrgencyLevel } from "@/lib/sla";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";
import { eq } from "drizzle-orm";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  MonitorCog,
  RefreshCw,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CommentForm } from "./comment-form";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}

export default async function WorkOrderDetailPage({
  params,
  searchParams,
}: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id: workOrderId } = await params;
  const { success } = await searchParams;

  // ... rest of data fetching ...
  const workOrder = await db.query.workOrders.findFirst({
    where: eq(workOrders.id, workOrderId),
    with: {
      equipment: {
        with: {
          location: true,
        },
      },
      reportedBy: {
        columns: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
      assignedTo: {
        columns: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
      logs: {
        orderBy: (logs, { desc }) => [desc(logs.createdAt)],
        with: {
          createdBy: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!workOrder) {
    notFound();
  }

  // Check if user owns this work order
  if (workOrder.reportedById !== user.id && user.roleName === "Operator") {
    redirect("/my-tickets");
  }

  const urgency = getUrgencyLevel(workOrder.dueBy);

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Success Banner */}
      {success === "true" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3 shadow-sm animate-in zoom-in-95 duration-300">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-900">
              Ticket Reported Successfully
            </h3>
            <p className="text-xs text-emerald-700 font-medium">
              A technician has been notified and will respond based on the
              priority level.
            </p>
          </div>
        </div>
      )}

      {/* Breadcrumb and Actions */}
      <div className="flex items-center justify-between no-print px-1">
        <nav className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
          <Link
            href="/my-tickets"
            className="hover:text-primary-600 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            My Tickets
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900">#{workOrder.displayId}</span>
        </nav>

        <PrintButton />
      </div>

      {/* Main Header Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary-500/10" />

        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded uppercase">
                  Ticket #{workOrder.displayId}
                </span>
                <StatusBadge status={workOrder.status} showIcon />
              </div>
              <h1 className="text-xl font-black text-zinc-900 tracking-tight leading-tight">
                {workOrder.title}
              </h1>
              <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Reported {formatRelativeTime(workOrder.createdAt)}
                </div>
                <span className="text-zinc-300">•</span>
                <div className="flex items-center gap-1">
                  <StatusBadge
                    status={workOrder.priority}
                    className="text-[10px] py-0 px-2 h-5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SLA indicator */}
          {workOrder.status !== "resolved" &&
            workOrder.status !== "closed" &&
            workOrder.dueBy && (
              <div
                className={cn(
                  "rounded-xl p-3 border flex items-center gap-3",
                  urgency === "overdue"
                    ? "bg-rose-50 border-rose-100 text-rose-700"
                    : urgency === "critical"
                      ? "bg-amber-50 border-amber-100 text-amber-700"
                      : "bg-zinc-50 border-zinc-100 text-zinc-600"
                )}
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                    SLA Requirement
                  </span>
                  <span className="text-sm font-bold">
                    {formatTimeRemaining(workOrder.dueBy)}
                  </span>
                </div>
              </div>
            )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Equipment info */}
        {workOrder.equipment && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MonitorCog className="h-4 w-4 text-primary-600" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Asset Information
              </h2>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100 p-2">
                <MonitorCog className="h-full w-full text-zinc-400" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-zinc-900 truncate">
                  {workOrder.equipment.name}
                </p>
                <p className="text-xs font-mono text-zinc-500 mt-0.5">
                  {workOrder.equipment.code}
                </p>
                {workOrder.equipment.location && (
                  <p className="text-[11px] font-medium text-zinc-400 mt-1">
                    {workOrder.equipment.location.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Assignment */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <UserIcon className="h-4 w-4 text-primary-600" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Responsible Tech
            </h2>
          </div>
          {workOrder.assignedTo ? (
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                <span className="text-sm font-black uppercase">
                  {workOrder.assignedTo.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-bold text-sm text-zinc-900">
                  {workOrder.assignedTo.name}
                </p>
                <p className="text-xs font-mono text-zinc-500 mt-0.5">
                  ID: {workOrder.assignedTo.employeeId}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[42px] flex items-center justify-center rounded-xl bg-zinc-50 border border-dashed border-zinc-200">
              <p className="text-xs text-zinc-400 font-medium italic">
                Awaiting technician assignment...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Description & Resolution */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
            Issue Description
          </h2>
          <div className="text-sm text-zinc-700 leading-relaxed bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
            {workOrder.description}
          </div>
        </div>

        {/* Resolution notes */}
        {workOrder.resolutionNotes && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">
                Resolution Report
              </h2>
            </div>
            <div className="text-sm text-emerald-900 leading-relaxed font-medium bg-white/50 p-4 rounded-xl border border-emerald-100">
              {workOrder.resolutionNotes}
            </div>
            {workOrder.resolvedAt && (
              <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600/60">
                <Calendar className="h-3 w-3" />
                Completed {formatDateTime(workOrder.resolvedAt)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activity log */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Communication & History
          </h2>
        </div>

        {/* Add comment form */}
        {workOrder.status !== "resolved" && workOrder.status !== "closed" && (
          <div className="mb-8">
            <CommentForm workOrderId={workOrder.id} />
          </div>
        )}

        {/* Activity timeline */}
        <div className="relative space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-zinc-100">
          {workOrder.logs.map((log) => (
            <ActivityItem key={log.id} log={log} />
          ))}

          {/* Created event */}
          <div className="flex gap-4 group relative">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 border border-primary-100 z-10">
              <AlertCircle className="h-4 w-4 text-primary-600" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-xs text-zinc-900 font-bold">
                <span className="text-primary-700 underline decoration-primary-200">
                  {workOrder.reportedBy?.name}
                </span>{" "}
                initiated the request
              </p>
              <p className="text-[10px] font-medium text-zinc-400 mt-0.5">
                {formatDateTime(workOrder.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ActivityLog {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string;
  createdAt: Date;
  createdBy: { id: string; name: string } | null;
}

function ActivityItem({ log }: { log: ActivityLog }) {
  const getIcon = () => {
    switch (log.action) {
      case "status_change":
        return <RefreshCw className="h-4 w-4 text-zinc-500" />;
      case "assignment":
        return <UserIcon className="h-4 w-4 text-zinc-500" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-primary-600" />;
      default:
        return null;
    }
  };

  const getMessage = () => {
    switch (log.action) {
      case "status_change":
        return (
          <>
            updated status from{" "}
            <span className="font-bold text-zinc-900">{log.oldValue}</span> to{" "}
            <span className="font-bold text-zinc-900">{log.newValue}</span>
          </>
        );
      case "assignment":
        return log.newValue === "unassigned" ? (
          <>removed technical assignment</>
        ) : (
          <>assigned a technician to resolve the issue</>
        );
      case "comment":
        return (
          <div className="space-y-2">
            <span className="text-zinc-500">added a note:</span>
            <div className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700 border border-zinc-100 font-medium leading-relaxed">
              {log.newValue}
            </div>
          </div>
        );
      default:
        return <span>{log.newValue}</span>;
    }
  };

  return (
    <div className="flex gap-4 group relative">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full z-10",
          log.action === "comment"
            ? "bg-primary-50 border border-primary-100"
            : "bg-zinc-50 border border-zinc-100"
        )}
      >
        {getIcon()}
      </div>
      <div className="flex-1 pt-1">
        <div className="text-xs text-zinc-600">
          <span className="font-black text-zinc-900 uppercase tracking-tighter mr-1">
            {log.createdBy?.name || "System"}
          </span>{" "}
          {getMessage()}
        </div>
        <p className="text-[10px] font-medium text-zinc-400 mt-1">
          {formatDateTime(log.createdAt)}
        </p>
      </div>
    </div>
  );
}
