import { TimeLogger } from "@/components/time-logger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { attachments, laborLogs, tickets, users } from "@/db/schema";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { getCurrentUser } from "@/lib/session";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MapPin,
  MessageSquare,
  User,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TicketActions } from "./ticket-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;
  const ticketId = Number(id);

  if (Number.isNaN(ticketId)) notFound();

  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, ticketId),
    with: {
      machine: {
        with: {
          location: true,
        },
      },
      reportedBy: true,
      assignedTo: true,
      logs: {
        with: {
          createdBy: true,
        },
        orderBy: (logs, { desc }) => [desc(logs.createdAt)],
      },
    },
  });

  if (!ticket) notFound();

  // Fetch attachments
  const rawAttachments = await db.query.attachments.findMany({
    where: and(
      eq(attachments.entityType, "ticket"),
      eq(attachments.entityId, ticketId)
    ),
  });

  // Generate presigned URLs
  const ticketAttachments = await Promise.all(
    rawAttachments.map(async (att) => ({
      ...att,
      url: await getPresignedDownloadUrl(att.s3Key),
    }))
  );

  // Fetch all techs for assignment dropdown (if needed later)
  const techs = await db.query.users.findMany({
    where: and(eq(users.role, "tech"), eq(users.isActive, true)),
  });

  // Fetch labor logs for this ticket
  const ticketLaborLogs = await db.query.laborLogs.findMany({
    where: eq(laborLogs.ticketId, ticketId),
    with: {
      user: true,
    },
    orderBy: (logs, { desc }) => [desc(logs.createdAt)],
  });

  // Status Configuration
  const statusConfig = {
    open: {
      label: "Open",
      icon: AlertTriangle,
      color: "text-primary-700",
      bg: "bg-primary-50",
      border: "border-primary-200",
    },
    in_progress: {
      label: "In Progress",
      icon: Wrench,
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    resolved: {
      label: "Resolved",
      icon: CheckCircle2,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    closed: {
      label: "Closed",
      icon: CheckCircle2,
      color: "text-slate-700",
      bg: "bg-slate-50",
      border: "border-slate-200",
    },
  }[ticket.status];

  const priorityConfig = {
    low: { color: "bg-slate-500", label: "Low" },
    medium: { color: "bg-primary-500", label: "Medium" },
    high: { color: "bg-amber-500", label: "High" },
    critical: { color: "bg-rose-600", label: "Critical" },
  }[ticket.priority];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard" className="gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Header Card */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Status Stripe */}
        <div
          className={cn(
            "flex items-center justify-between border-b px-6 py-4",
            statusConfig.bg,
            statusConfig.border
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm",
                statusConfig.color
              )}
            >
              <StatusIcon className="h-5 w-5" />
            </div>
            <div>
              <p
                className={cn(
                  "text-xs font-bold uppercase tracking-wider opacity-70",
                  statusConfig.color
                )}
              >
                Status
              </p>
              <p
                className={cn(
                  "text-lg font-bold leading-none",
                  statusConfig.color
                )}
              >
                {statusConfig.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Priority
              </p>
              <div className="flex items-center gap-2 justify-end">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    priorityConfig.color
                  )}
                />
                <span className="font-bold text-foreground">
                  {priorityConfig.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono text-xs">
                #{ticket.id}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Reported {formatRelativeTime(ticket.createdAt)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {ticket.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Details & Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {ticket.description}
            </p>
          </div>

          {/* Attachments */}
          {ticketAttachments.length > 0 && (
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Attachments</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {ticketAttachments.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex flex-col overflow-hidden rounded-lg border bg-slate-50 transition-all hover:border-primary-300 hover:shadow-md"
                  >
                    {file.mimeType.startsWith("image/") ? (
                      <div className="aspect-video w-full overflow-hidden bg-slate-100">
                        <img
                          src={file.url}
                          alt={file.filename}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center bg-slate-100 text-slate-400">
                        <FileText className="h-10 w-10" />
                      </div>
                    )}
                    <div className="flex items-center justify-between p-3">
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-xs font-medium text-foreground">
                          {file.filename}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {(file.sizeBytes / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary-600" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Resolution (if resolved) */}
          {ticket.resolutionNotes && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-emerald-800">
                <CheckCircle2 className="h-5 w-5" />
                <h2 className="font-bold">Resolution Notes</h2>
              </div>
              <p className="text-emerald-900/80 whitespace-pre-wrap">
                {ticket.resolutionNotes}
              </p>
              {ticket.resolvedAt && (
                <p className="text-xs text-emerald-700 mt-4 font-medium">
                  Resolved on {formatDate(ticket.resolvedAt)}
                </p>
              )}
            </div>
          )}

          {/* Activity Log */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold px-1">Activity Log</h2>
            <div className="rounded-xl border bg-card shadow-sm divide-y">
              {ticket.logs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No activity yet.
                </div>
              ) : (
                ticket.logs.map((log) => (
                  <div key={log.id} className="p-4 flex gap-4">
                    <div className="mt-1">
                      {log.action === "comment" ? (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <Clock className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          {log.createdBy.name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(log.createdAt)}
                        </span>
                      </div>

                      {log.action === "comment" ? (
                        <p className="text-sm text-foreground bg-slate-50 p-3 rounded-lg border">
                          {log.newValue}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Changed{" "}
                          <strong>{log.action.replace("_", " ")}</strong> from{" "}
                          <span className="line-through opacity-70">
                            {log.oldValue || "none"}
                          </span>{" "}
                          to{" "}
                          <span className="font-medium text-foreground">
                            {log.newValue}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Meta & Actions */}
        <div className="space-y-6">
          <TicketActions
            ticket={ticket}
            currentUser={{ id: user.id, name: user.name }}
            allTechs={techs}
          />

          {/* Machine Info */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-3 border-b">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Machine
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="font-bold text-foreground">
                    {ticket.machine.name}
                  </p>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {ticket.machine.code}
                  </Badge>
                </div>
              </div>

              {ticket.machine.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {ticket.machine.location.name}
                </div>
              )}
            </div>
          </div>

          {/* Time Tracking */}
          {(user.role === "tech" || user.role === "admin") && (
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-4 py-3 border-b">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Time Tracking
                </h3>
              </div>
              <div className="p-4">
                <TimeLogger
                  ticketId={ticket.id}
                  userId={user.id}
                  userHourlyRate={user.hourlyRate}
                  existingLogs={ticketLaborLogs}
                />
              </div>
            </div>
          )}

          {/* Meta Details */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-3 border-b">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Details
              </h3>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-dashed">
                <span className="text-muted-foreground">Reported By</span>
                <span className="font-medium flex items-center gap-2">
                  <User className="h-3 w-3" />
                  {ticket.reportedBy.name}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-dashed">
                <span className="text-muted-foreground">Assigned To</span>
                <span className="font-medium">
                  {ticket.assignedTo ? (
                    ticket.assignedTo.name
                  ) : (
                    <span className="text-muted-foreground italic">
                      Unassigned
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Due Date</span>
                <span
                  className={cn(
                    "font-medium",
                    ticket.dueBy &&
                      new Date(ticket.dueBy) < new Date() &&
                      ticket.status !== "resolved"
                      ? "text-red-600"
                      : ""
                  )}
                >
                  {ticket.dueBy ? formatDate(ticket.dueBy) : "None"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
