import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { formatTimeRemaining, getUrgencyLevel } from "@/lib/sla";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CommentForm } from "./comment-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const ticketId = Number.parseInt(id, 10);

  if (Number.isNaN(ticketId)) {
    notFound();
  }

  // Fetch ticket with all related data
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, ticketId),
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

  if (!ticket) {
    notFound();
  }

  // Check if user owns this ticket
  if (ticket.reportedById !== user.id && user.role === "operator") {
    redirect("/my-tickets");
  }

  const urgency = getUrgencyLevel(ticket.dueBy);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/my-tickets" className="hover:text-foreground">
          My Tickets
        </Link>
        <span>/</span>
        <span className="text-foreground">#{ticket.id}</span>
      </nav>

      {/* Ticket header */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{ticket.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Reported {formatRelativeTime(ticket.createdAt)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>

        {/* SLA indicator */}
        {ticket.status !== "resolved" &&
          ticket.status !== "closed" &&
          ticket.dueBy && (
            <div
              className={`mt-4 rounded-lg p-3 ${
                urgency === "overdue"
                  ? "bg-danger-50 text-danger-700"
                  : urgency === "critical"
                    ? "bg-warning-50 text-warning-700"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  {formatTimeRemaining(ticket.dueBy)}
                </span>
              </div>
            </div>
          )}
      </div>

      {/* Equipment info */}
      {ticket.equipment && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Equipment
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium">{ticket.equipment.name}</p>
              <p className="text-sm text-muted-foreground">
                {ticket.equipment.code}
                {ticket.equipment.location &&
                  ` • ${ticket.equipment.location.name}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          Description
        </h2>
        <p className="mt-2 whitespace-pre-wrap">{ticket.description}</p>
      </div>

      {/* Assignment */}
      {ticket.assignedTo ? (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Assigned Technician
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              {ticket.assignedTo.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{ticket.assignedTo.name}</p>
              <p className="text-sm text-muted-foreground">
                {ticket.assignedTo.employeeId}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Waiting for a technician to be assigned...
          </p>
        </div>
      )}

      {/* Resolution notes */}
      {ticket.resolutionNotes && (
        <div className="rounded-lg border border-success-200 bg-success-50 p-4">
          <h2 className="text-sm font-medium text-success-700">Resolution</h2>
          <p className="mt-2 whitespace-pre-wrap text-success-800">
            {ticket.resolutionNotes}
          </p>
          {ticket.resolvedAt && (
            <p className="mt-2 text-sm text-success-600">
              Resolved {formatDateTime(ticket.resolvedAt)}
            </p>
          )}
        </div>
      )}

      {/* Activity log */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-medium text-muted-foreground">Activity</h2>

        {/* Add comment form */}
        {ticket.status !== "resolved" && ticket.status !== "closed" && (
          <CommentForm ticketId={ticket.id} />
        )}

        {/* Activity timeline */}
        <div className="mt-4 space-y-4">
          {ticket.logs.map((log) => (
            <ActivityItem key={log.id} log={log} />
          ))}

          {/* Created event */}
          <div className="flex gap-3 text-sm">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
              <svg
                className="h-4 w-4 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <div>
              <p>
                <span className="font-medium">{ticket.reportedBy?.name}</span>{" "}
                created this ticket
              </p>
              <p className="text-muted-foreground">
                {formatDateTime(ticket.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { label: string; variant: "default" | "warning" | "success" | "secondary" }
  > = {
    open: { label: "Open", variant: "default" },
    in_progress: { label: "In Progress", variant: "warning" },
    resolved: { label: "Resolved", variant: "success" },
    closed: { label: "Closed", variant: "secondary" },
  };

  const { label, variant } = config[status] || config.open;
  return <Badge variant={variant}>{label}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<
    string,
    { label: string; variant: "default" | "warning" | "danger" | "secondary" }
  > = {
    low: { label: "Low Priority", variant: "secondary" },
    medium: { label: "Medium Priority", variant: "default" },
    high: { label: "High Priority", variant: "warning" },
    critical: { label: "Critical", variant: "danger" },
  };

  const { label, variant } = config[priority] || config.medium;
  return <Badge variant={variant}>{label}</Badge>;
}

interface ActivityLog {
  id: number;
  action: string;
  oldValue: string | null;
  newValue: string;
  createdAt: Date;
  createdBy: { id: number; name: string } | null;
}

function ActivityItem({ log }: { log: ActivityLog }) {
  const getIcon = () => {
    switch (log.action) {
      case "status_change":
        return (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        );
      case "assignment":
        return (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      case "comment":
        return (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getMessage = () => {
    switch (log.action) {
      case "status_change":
        return (
          <>
            changed status from{" "}
            <span className="font-medium">{log.oldValue}</span> to{" "}
            <span className="font-medium">{log.newValue}</span>
          </>
        );
      case "assignment":
        return log.newValue === "unassigned" ? (
          <>unassigned the ticket</>
        ) : (
          <>assigned a technician</>
        );
      case "comment":
        return (
          <>
            added a comment:
            <p className="mt-1 rounded-lg bg-muted p-3 text-foreground">
              {log.newValue}
            </p>
          </>
        );
      default:
        return log.newValue;
    }
  };

  return (
    <div className="flex gap-3 text-sm">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p>
          <span className="font-medium">{log.createdBy?.name || "System"}</span>{" "}
          {getMessage()}
        </p>
        <p className="text-muted-foreground">{formatDateTime(log.createdAt)}</p>
      </div>
    </div>
  );
}
