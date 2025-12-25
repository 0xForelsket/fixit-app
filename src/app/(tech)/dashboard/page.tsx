import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { and, count, eq, lt } from "drizzle-orm";
import { AlertTriangle, CheckCircle, ClipboardList, Clock } from "lucide-react";
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

  const statCards = [
    {
      title: "Open Tickets",
      value: stats.open,
      icon: <ClipboardList className="h-5 w-5" />,
      color: "text-primary-600",
      bgColor: "bg-primary-100",
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      icon: <Clock className="h-5 w-5" />,
      color: "text-warning-600",
      bgColor: "bg-warning-100",
    },
    {
      title: "Overdue",
      value: stats.overdue,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-danger-600",
      bgColor: "bg-danger-100",
    },
    {
      title: "Critical",
      value: stats.critical,
      icon: <CheckCircle className="h-5 w-5" />,
      color: "text-danger-600",
      bgColor: "bg-danger-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Open Tickets</CardTitle>
          <Link
            href="/dashboard/tickets"
            className="text-sm text-primary-600 hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recentTickets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No open tickets
            </p>
          ) : (
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/dashboard/tickets/${ticket.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{ticket.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {ticket.machine.name} • Reported by{" "}
                      {ticket.reportedBy.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        ticket.priority === "critical"
                          ? "danger"
                          : ticket.priority === "high"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {ticket.priority}
                    </Badge>
                    <Badge variant="outline">{ticket.type}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
