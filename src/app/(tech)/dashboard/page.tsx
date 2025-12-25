import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
          delay={1}
        />
        <StatsCard
          title="In Progress"
          value={stats.inProgress}
          icon={Timer}
          color="text-amber-600"
          bg="bg-amber-50"
          border="border-amber-200"
          delay={2}
        />
        <StatsCard
          title="Overdue"
          value={stats.overdue}
          icon={Clock}
          color="text-rose-600"
          bg="bg-rose-50"
          border="border-rose-200"
          pulse={stats.overdue > 0}
          delay={3}
        />
        <StatsCard
          title="Critical"
          value={stats.critical}
          icon={AlertTriangle}
          color="text-rose-700"
          bg="bg-rose-100"
          border="border-rose-300"
          pulse={stats.critical > 0}
          delay={4}
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
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-transparent p-12 text-center animate-in">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl animate-gentle-pulse" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-lg">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <h3 className="mt-6 text-xl font-bold text-emerald-800">
              All caught up! 🎉
            </h3>
            <p className="text-sm text-emerald-600/80 mt-1">
              No open tickets requiring attention.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {recentTickets.map((ticket, index) => (
              <TicketListItem key={ticket.id} ticket={ticket} index={index} />
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
  pulse = false,
  delay = 0,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  pulse?: boolean;
  delay?: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 bg-gradient-to-br from-white to-slate-50/50",
        border,
        pulse && value > 0 && "animate-glow-pulse",
        delay && `animate-stagger-${delay} animate-in`
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg shadow-sm",
          bg
        )}
      >
        <Icon className={cn("h-6 w-6", color)} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p
          className={cn(
            "text-3xl font-bold leading-none tracking-tight",
            color
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function TicketListItem({
  ticket,
  index = 0,
}: { ticket: any; index?: number }) {
  const priorityConfig = {
    low: { color: "bg-slate-500", label: "Low" },
    medium: { color: "bg-primary-500", label: "Medium" },
    high: { color: "bg-amber-500", label: "High" },
    critical: { color: "bg-rose-600", label: "Critical" },
  }[ticket.priority as string] || {
    color: "bg-slate-500",
    label: ticket.priority,
  };

  const staggerClass = index < 5 ? `animate-stagger-${index + 1}` : "";

  return (
    <Link
      href={`/dashboard/tickets/${ticket.id}`}
      className={cn(
        "group relative flex items-center gap-4 overflow-hidden rounded-xl border bg-gradient-to-r from-white to-slate-50/50 p-4 transition-all duration-200 hover:border-primary-300 hover:shadow-lg hover:-translate-y-0.5",
        staggerClass && `${staggerClass} animate-in`,
        ticket.priority === "critical" && "ring-1 ring-rose-200 border-rose-200"
      )}
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
