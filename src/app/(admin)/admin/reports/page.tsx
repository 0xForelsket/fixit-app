import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { type TicketPriority, type TicketStatus, tickets } from "@/db/schema";
import { cn } from "@/lib/utils";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  Inbox,
  Timer,
} from "lucide-react";
import Link from "next/link";

type SearchParams = {
  status?: string;
  priority?: string;
  from?: string;
  to?: string;
  page?: string;
};

const PAGE_SIZE = 25;

async function getTickets(params: SearchParams) {
  const page = Number.parseInt(params.page || "1", 10);
  const offset = (page - 1) * PAGE_SIZE;

  const conditions = [];

  if (params.status && params.status !== "all") {
    conditions.push(eq(tickets.status, params.status as TicketStatus));
  }

  if (params.priority && params.priority !== "all") {
    conditions.push(eq(tickets.priority, params.priority as TicketPriority));
  }

  if (params.from) {
    const fromDate = new Date(params.from);
    conditions.push(gte(tickets.createdAt, fromDate));
  }

  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(tickets.createdAt, toDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const ticketsList = await db.query.tickets.findMany({
    where: whereClause,
    limit: PAGE_SIZE,
    offset,
    orderBy: [desc(tickets.createdAt)],
    with: {
      equipment: { with: { location: true } },
      reportedBy: true,
      assignedTo: true,
    },
  });

  const [totalResult] = await db
    .select({ count: count() })
    .from(tickets)
    .where(whereClause);

  return {
    tickets: ticketsList,
    total: totalResult.count,
    page,
    totalPages: Math.ceil(totalResult.count / PAGE_SIZE),
  };
}

async function getStats(params: SearchParams) {
  const conditions = [];

  if (params.from) {
    const fromDate = new Date(params.from);
    conditions.push(gte(tickets.createdAt, fromDate));
  }

  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(tickets.createdAt, toDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const allTickets = await db.query.tickets.findMany({
    where: whereClause,
  });

  const resolved = allTickets.filter(
    (t) => t.status === "resolved" || t.status === "closed"
  );
  const avgResolutionTime =
    resolved.length > 0
      ? resolved.reduce((sum, t) => {
          if (t.resolvedAt && t.createdAt) {
            return (
              sum +
              (new Date(t.resolvedAt).getTime() -
                new Date(t.createdAt).getTime())
            );
          }
          return sum;
        }, 0) /
        resolved.length /
        (1000 * 60 * 60) // Convert to hours
      : 0;

  return {
    total: allTickets.length,
    open: allTickets.filter((t) => t.status === "open").length,
    resolved: resolved.length,
    critical: allTickets.filter((t) => t.priority === "critical").length,
    avgResolutionHours: Math.round(avgResolutionTime * 10) / 10,
  };
}

function buildSearchParams(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && value !== "all") {
      searchParams.set(key, value);
    }
  }
  return searchParams.toString();
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const {
    tickets: ticketsList,
    total,
    page,
    totalPages,
  } = await getTickets(params);
  const stats = await getStats(params);

  const hasFilters =
    params.status || params.priority || params.from || params.to;

  // Build CSV export URL
  const csvParams = new URLSearchParams();
  if (params.status && params.status !== "all")
    csvParams.set("status", params.status);
  if (params.priority && params.priority !== "all")
    csvParams.set("priority", params.priority);
  if (params.from) csvParams.set("from", params.from);
  if (params.to) csvParams.set("to", params.to);
  const csvUrl = `/api/reports/export?${csvParams.toString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            {total} tickets {hasFilters && "matching filters"}
          </p>
        </div>
        <Button asChild>
          <a href={csvUrl} download="ticket-report.csv">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </a>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard
          title="Total Tickets"
          value={stats.total}
          icon={FileText}
          color="text-primary-600"
          bg="bg-primary-50"
        />
        <StatCard
          title="Open"
          value={stats.open}
          icon={Inbox}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <StatCard
          title="Critical"
          value={stats.critical}
          icon={AlertTriangle}
          color="text-rose-600"
          bg="bg-rose-50"
        />
        <StatCard
          title="Avg Resolution"
          value={`${stats.avgResolutionHours}h`}
          icon={Timer}
          color="text-slate-600"
          bg="bg-slate-50"
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-white p-4">
        <form
          action="/admin/reports"
          method="get"
          className="flex flex-wrap items-end gap-4"
        >
          <div className="space-y-1">
            <label
              htmlFor="from-date"
              className="text-xs font-medium text-muted-foreground"
            >
              From Date
            </label>
            <input
              type="date"
              id="from-date"
              name="from"
              defaultValue={params.from}
              className="rounded-lg border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="to-date"
              className="text-xs font-medium text-muted-foreground"
            >
              To Date
            </label>
            <input
              type="date"
              id="to-date"
              name="to"
              defaultValue={params.to}
              className="rounded-lg border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="status-filter"
              className="text-xs font-medium text-muted-foreground"
            >
              Status
            </label>
            <select
              id="status-filter"
              name="status"
              defaultValue={params.status || "all"}
              className="rounded-lg border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="priority-filter"
              className="text-xs font-medium text-muted-foreground"
            >
              Priority
            </label>
            <select
              id="priority-filter"
              name="priority"
              defaultValue={params.priority || "all"}
              className="rounded-lg border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <Button type="submit">
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
          {hasFilters && (
            <Button variant="ghost" asChild>
              <Link href="/admin/reports">Clear</Link>
            </Button>
          )}
        </form>
      </div>

      {/* Tickets Table */}
      {ticketsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No tickets found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your date range or filters
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr className="text-left font-medium text-muted-foreground">
                <th className="p-3">ID</th>
                <th className="p-3">Title</th>
                <th className="p-3 hidden md:table-cell">Equipment</th>
                <th className="p-3 hidden lg:table-cell">Location</th>
                <th className="p-3">Status</th>
                <th className="p-3 hidden sm:table-cell">Priority</th>
                <th className="p-3 hidden xl:table-cell">Reported By</th>
                <th className="p-3 hidden xl:table-cell">Assigned To</th>
                <th className="p-3">Created</th>
                <th className="p-3 hidden lg:table-cell">Resolved</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ticketsList.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              asChild={page > 1}
            >
              {page > 1 ? (
                <Link
                  href={`/admin/reports?${buildSearchParams({ ...params, page: String(page - 1) })}`}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Link>
              ) : (
                <span>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              asChild={page < totalPages}
            >
              {page < totalPages ? (
                <Link
                  href={`/admin/reports?${buildSearchParams({ ...params, page: String(page + 1) })}`}
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <span>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-4 bg-white">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          bg
        )}
      >
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn("text-2xl font-bold", color)}>{value}</p>
      </div>
    </div>
  );
}

interface TicketWithRelations {
  id: number;
  title: string;
  status: string;
  priority: string;
  createdAt: Date;
  resolvedAt: Date | null;
  equipment?: { name: string; location?: { name: string } | null } | null;
  reportedBy?: { name: string } | null;
  assignedTo?: { name: string } | null;
}

function TicketRow({ ticket }: { ticket: TicketWithRelations }) {
  const statusConfig: Record<
    string,
    { color: string; bg: string; label: string }
  > = {
    open: { color: "text-primary-700", bg: "bg-primary-50", label: "Open" },
    in_progress: {
      color: "text-amber-700",
      bg: "bg-amber-50",
      label: "In Progress",
    },
    resolved: {
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      label: "Resolved",
    },
    closed: { color: "text-slate-700", bg: "bg-slate-50", label: "Closed" },
  };

  const priorityConfig: Record<
    string,
    { color: string; bg: string; label: string }
  > = {
    low: { color: "text-slate-700", bg: "bg-slate-50", label: "Low" },
    medium: { color: "text-primary-700", bg: "bg-primary-50", label: "Medium" },
    high: { color: "text-amber-700", bg: "bg-amber-50", label: "High" },
    critical: { color: "text-rose-700", bg: "bg-rose-50", label: "Critical" },
  };

  const status = statusConfig[ticket.status] || statusConfig.open;
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium;

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="p-3">
        <Link
          href={`/dashboard/tickets/${ticket.id}`}
          className="font-mono text-xs text-primary-600 hover:underline"
        >
          #{ticket.id}
        </Link>
      </td>
      <td className="p-3">
        <span className="line-clamp-1">{ticket.title}</span>
      </td>
      <td className="p-3 hidden md:table-cell text-muted-foreground">
        {ticket.equipment?.name || "—"}
      </td>
      <td className="p-3 hidden lg:table-cell text-muted-foreground">
        {ticket.equipment?.location?.name || "—"}
      </td>
      <td className="p-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            status.bg,
            status.color
          )}
        >
          {status.label}
        </span>
      </td>
      <td className="p-3 hidden sm:table-cell">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            priority.bg,
            priority.color
          )}
        >
          {priority.label}
        </span>
      </td>
      <td className="p-3 hidden xl:table-cell text-muted-foreground">
        {ticket.reportedBy?.name || "—"}
      </td>
      <td className="p-3 hidden xl:table-cell text-muted-foreground">
        {ticket.assignedTo?.name || "Unassigned"}
      </td>
      <td className="p-3 text-muted-foreground">
        {new Date(ticket.createdAt).toLocaleDateString()}
      </td>
      <td className="p-3 hidden lg:table-cell text-muted-foreground">
        {ticket.resolvedAt
          ? new Date(ticket.resolvedAt).toLocaleDateString()
          : "—"}
      </td>
    </tr>
  );
}
