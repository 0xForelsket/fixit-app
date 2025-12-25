import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { cn, formatRelativeTime } from "@/lib/utils";
import { and, count, eq, ilike, or } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Filter,
  Inbox,
  Search,
  Timer,
  X,
} from "lucide-react";
import Link from "next/link";

type SearchParams = {
  status?: string;
  priority?: string;
  search?: string;
  page?: string;
};

const PAGE_SIZE = 10;

async function getTickets(params: SearchParams) {
  const page = Number.parseInt(params.page || "1", 10);
  const offset = (page - 1) * PAGE_SIZE;

  // Build where conditions
  const conditions = [];

  if (params.status && params.status !== "all") {
    conditions.push(eq(tickets.status, params.status as any));
  }

  if (params.priority && params.priority !== "all") {
    conditions.push(eq(tickets.priority, params.priority as any));
  }

  if (params.search) {
    conditions.push(
      or(
        ilike(tickets.title, `%${params.search}%`),
        ilike(tickets.description, `%${params.search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const ticketsList = await db.query.tickets.findMany({
    where: whereClause,
    limit: PAGE_SIZE,
    offset,
    orderBy: (tickets, { desc }) => [desc(tickets.createdAt)],
    with: {
      equipment: true,
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

async function getStats() {
  const [openTickets] = await db
    .select({ count: count() })
    .from(tickets)
    .where(eq(tickets.status, "open"));

  const [inProgressTickets] = await db
    .select({ count: count() })
    .from(tickets)
    .where(eq(tickets.status, "in_progress"));

  const [resolvedTickets] = await db
    .select({ count: count() })
    .from(tickets)
    .where(eq(tickets.status, "resolved"));

  const [criticalTickets] = await db
    .select({ count: count() })
    .from(tickets)
    .where(and(eq(tickets.priority, "critical"), eq(tickets.status, "open")));

  return {
    open: openTickets.count,
    inProgress: inProgressTickets.count,
    resolved: resolvedTickets.count,
    critical: criticalTickets.count,
  };
}

export default async function TicketsPage({
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
  const stats = await getStats();

  const activeFilters =
    (params.status && params.status !== "all") ||
    (params.priority && params.priority !== "all") ||
    params.search;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Tickets</h1>
          <p className="text-muted-foreground">
            {total} total tickets • Page {page} of {totalPages || 1}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatFilterCard
          title="Open"
          value={stats.open}
          icon={Inbox}
          color="text-primary-600"
          bg="bg-primary-50"
          href="?status=open"
          active={params.status === "open"}
        />
        <StatFilterCard
          title="In Progress"
          value={stats.inProgress}
          icon={Timer}
          color="text-amber-600"
          bg="bg-amber-50"
          href="?status=in_progress"
          active={params.status === "in_progress"}
        />
        <StatFilterCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          color="text-emerald-600"
          bg="bg-emerald-50"
          href="?status=resolved"
          active={params.status === "resolved"}
        />
        <StatFilterCard
          title="Critical"
          value={stats.critical}
          icon={AlertTriangle}
          color="text-rose-600"
          bg="bg-rose-50"
          href="?priority=critical"
          active={params.priority === "critical"}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form
          className="flex-1 min-w-[200px]"
          action="/dashboard/tickets"
          method="get"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="search"
              placeholder="Search tickets..."
              defaultValue={params.search}
              className="w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            {params.status && (
              <input type="hidden" name="status" value={params.status} />
            )}
            {params.priority && (
              <input type="hidden" name="priority" value={params.priority} />
            )}
          </div>
        </form>

        <FilterSelect
          name="status"
          value={params.status || "all"}
          options={[
            { value: "all", label: "All Status" },
            { value: "open", label: "Open" },
            { value: "in_progress", label: "In Progress" },
            { value: "resolved", label: "Resolved" },
            { value: "closed", label: "Closed" },
          ]}
          searchParams={params}
        />

        <FilterSelect
          name="priority"
          value={params.priority || "all"}
          options={[
            { value: "all", label: "All Priority" },
            { value: "critical", label: "Critical" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
          searchParams={params}
        />

        {activeFilters && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/tickets">
              <X className="mr-1 h-4 w-4" />
              Clear
            </Link>
          </Button>
        )}
      </div>

      {/* Tickets List */}
      {ticketsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No tickets found</h3>
          <p className="text-sm text-muted-foreground">
            {activeFilters
              ? "Try adjusting your filters"
              : "No tickets have been created yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b bg-slate-50">
              <tr className="text-left text-sm font-medium text-muted-foreground">
                <th className="p-4">ID</th>
                <th className="p-4">Ticket</th>
                <th className="p-4 hidden md:table-cell">Equipment</th>
                <th className="p-4 hidden lg:table-cell">Status</th>
                <th className="p-4 hidden lg:table-cell">Priority</th>
                <th className="p-4 hidden xl:table-cell">Assigned To</th>
                <th className="p-4 hidden sm:table-cell">Created</th>
                <th className="p-4" />
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
                  href={`/dashboard/tickets?${buildSearchParams({ ...params, page: String(page - 1) })}`}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Link>
              ) : (
                <span>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
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
                  href={`/dashboard/tickets?${buildSearchParams({ ...params, page: String(page + 1) })}`}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <span>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
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

function StatFilterCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
  href,
  active,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={active ? "/dashboard/tickets" : href}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-md bg-white",
        active && "ring-2 ring-primary-500 border-primary-300"
      )}
    >
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
    </Link>
  );
}

function FilterSelect({
  name,
  value,
  options,
  searchParams,
}: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  searchParams: SearchParams;
}) {
  const buildUrl = (newValue: string) => {
    const params: Record<string, string | undefined> = {
      ...searchParams,
      [name]: newValue === "all" ? undefined : newValue,
      page: undefined,
    };
    const queryString = buildSearchParams(params);
    return `/dashboard/tickets${queryString ? `?${queryString}` : ""}`;
  };

  const currentOption =
    options.find((o) => o.value === value)?.label || options[0].label;

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center gap-2 appearance-none rounded-lg border bg-white py-2 pl-3 pr-10 text-sm hover:border-primary-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      >
        <span>{currentOption}</span>
        <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </button>
      {/* Dropdown */}
      <div className="hidden group-focus-within:block group-hover:block absolute top-full left-0 mt-1 z-10 min-w-[150px] rounded-lg border bg-white shadow-lg py-1">
        {options.map((option) => (
          <Link
            key={option.value}
            href={buildUrl(option.value)}
            className={cn(
              "block px-3 py-2 text-sm hover:bg-slate-50",
              option.value === value &&
                "bg-primary-50 text-primary-700 font-medium"
            )}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: any }) {
  const statusConfig: Record<
    string,
    { color: string; bg: string; label: string }
  > = {
    open: {
      color: "text-primary-700",
      bg: "bg-primary-50 border-primary-200",
      label: "Open",
    },
    in_progress: {
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
      label: "In Progress",
    },
    resolved: {
      color: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-200",
      label: "Resolved",
    },
    closed: {
      color: "text-slate-700",
      bg: "bg-slate-50 border-slate-200",
      label: "Closed",
    },
  };

  const priorityConfig: Record<
    string,
    { color: string; bg: string; label: string }
  > = {
    low: {
      color: "text-slate-700",
      bg: "bg-slate-50 border-slate-200",
      label: "Low",
    },
    medium: {
      color: "text-primary-700",
      bg: "bg-primary-50 border-primary-200",
      label: "Medium",
    },
    high: {
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
      label: "High",
    },
    critical: {
      color: "text-rose-700",
      bg: "bg-rose-50 border-rose-200",
      label: "Critical",
    },
  };

  const status = statusConfig[ticket.status as string] || statusConfig.open;
  const priority =
    priorityConfig[ticket.priority as string] || priorityConfig.medium;

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="p-4">
        <Badge variant="outline" className="font-mono text-xs">
          #{ticket.id}
        </Badge>
      </td>
      <td className="p-4">
        <div className="space-y-1">
          <Link
            href={`/dashboard/tickets/${ticket.id}`}
            className="font-medium hover:text-primary-600 hover:underline"
          >
            {ticket.title}
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {ticket.description}
          </p>
        </div>
      </td>
      <td className="p-4 hidden md:table-cell">
        <span className="text-sm">{ticket.equipment?.name || "—"}</span>
      </td>
      <td className="p-4 hidden lg:table-cell">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
            status.bg,
            status.color
          )}
        >
          {status.label}
        </span>
      </td>
      <td className="p-4 hidden lg:table-cell">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
            priority.bg,
            priority.color
          )}
        >
          {priority.label}
        </span>
      </td>
      <td className="p-4 hidden xl:table-cell">
        <span className="text-sm">
          {ticket.assignedTo?.name || (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </span>
      </td>
      <td className="p-4 hidden sm:table-cell">
        <span className="text-sm text-muted-foreground">
          {formatRelativeTime(ticket.createdAt)}
        </span>
      </td>
      <td className="p-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/tickets/${ticket.id}`}>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </td>
    </tr>
  );
}
