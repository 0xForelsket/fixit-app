import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { cn, formatRelativeTime } from "@/lib/utils";
import { and, count, eq, lt } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Inbox,
  Timer,
} from "lucide-react";
import Link from "next/link";

async function getStats() {
  const [openTickets] = await db
    .select({ count: count() })
    .from(tickets)
    .where(eq(tickets.status, "open"));

  const [inProgressTickets] = await db
    .select({ count: count() })
    .from(tickets)
    .where(eq(tickets.status, "in_progress"));

  const [overdueTickets] = await db
    .select({ count: count() })
    .from(tickets)
    .where(and(lt(tickets.dueBy, new Date()), eq(tickets.status, "open")));

  const [criticalTickets] = await db
    .select({ count: count() })
    .from(tickets)
    .where(and(eq(tickets.priority, "critical"), eq(tickets.status, "open")));

  return {
    open: openTickets.count,
    inProgress: inProgressTickets.count,
    overdue: overdueTickets.count,
    critical: criticalTickets.count,
  };
}

async function getRecentTickets() {
  return db.query.tickets.findMany({
    where: eq(tickets.status, "open"),
    limit: 5,
    orderBy: (tickets, { desc }) => [desc(tickets.createdAt)],
    with: {
      machine: true,
      reportedBy: true,
    },
  });
}

export default async function DashboardPage() {
  const stats = await getStats();
  const recentTickets = await getRecentTickets();

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Open Tickets"
          value={stats.open}
          icon={Inbox}
          color="text-primary-600"
          bg="bg-primary-50"
          border="border-primary-200"
        />
        <StatsCard
          title="In Progress"
          value={stats.inProgress}
          icon={Timer}
          color="text-amber-600"
          bg="bg-amber-50"
          border="border-amber-200"
        />
        <StatsCard
          title="Overdue"
          value={stats.overdue}
          icon={Clock}
          color="text-rose-600"
          bg="bg-rose-50"
          border="border-rose-200"
        />
        <StatsCard
          title="Critical"
          value={stats.critical}
          icon={AlertTriangle}
          color="text-rose-700"
          bg="bg-rose-100"
          border="border-rose-300"
        />
      </div>

      {/* Recent Tickets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">
            Recent Open Tickets
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/tickets" className="gap-2">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {recentTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
            <p className="text-sm text-muted-foreground">
              No open tickets requiring attention.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {recentTickets.map((ticket) => (
              <TicketListItem key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
  border,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border p-5 shadow-sm transition-all hover:shadow-md bg-white",
        border
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg",
          bg
        )}
      >
        <Icon className={cn("h-6 w-6", color)} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn("text-3xl font-bold leading-none", color)}>{value}</p>
      </div>
    </div>
  );
}

function TicketListItem({ ticket }: { ticket: any }) {
  const priorityConfig = {
    low: { color: "bg-slate-500", label: "Low" },
    medium: { color: "bg-primary-500", label: "Medium" },
    high: { color: "bg-amber-500", label: "High" },
    critical: { color: "bg-rose-600", label: "Critical" },
  }[ticket.priority as string] || {
    color: "bg-slate-500",
    label: ticket.priority,
  };

  return (
    <Link
      href={`/dashboard/tickets/${ticket.id}`}
      className="group relative flex items-center gap-4 overflow-hidden rounded-xl border bg-white p-4 transition-all hover:border-primary-300 hover:shadow-md"
    >
      {/* Priority Strip */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1.5",
          priorityConfig.color
        )}
      />

      <div className="ml-2 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            #{ticket.id}
          </Badge>
          <span className="font-semibold text-foreground group-hover:text-primary-700">
            {ticket.title}
          </span>
          {ticket.priority === "critical" && (
            <Badge variant="danger" className="ml-auto sm:ml-2">
              CRITICAL
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground/80">
            {ticket.machine.name}
          </span>
          <span>•</span>
          <span>{formatRelativeTime(ticket.createdAt)}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">by {ticket.reportedBy.name}</span>
        </div>
      </div>

      <div className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary-600">
        <ArrowRight className="h-5 w-5" />
      </div>
    </Link>
  );
}
