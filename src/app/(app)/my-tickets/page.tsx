import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLayout } from "@/components/ui/page-layout";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkOrderCard } from "@/components/work-orders/work-order-card";
import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";
import { CheckCircle2, Inbox, Plus, Timer } from "lucide-react";
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

  // Fetch user's work orders with full relations for WorkOrderCard
  const userWorkOrders = await db.query.workOrders.findMany({
    where: eq(workOrders.reportedById, user.id),
    orderBy: (workOrders, { desc }) => [desc(workOrders.createdAt)],
    with: {
      equipment: {
        with: {
          location: true,
        },
      },
      reportedBy: true,
      assignedTo: true,
    },
  });

  // Group by status
  const activeWorkOrders = userWorkOrders.filter(
    (t) => t.status === "open" || t.status === "in_progress"
  );
  const resolvedWorkOrders = userWorkOrders.filter(
    (t) => t.status === "resolved" || t.status === "closed"
  );

  const stats = [
    {
      label: "Open Requests",
      value: activeWorkOrders.filter((t) => t.status === "open").length,
      icon: Inbox,
      variant: "primary" as const,
    },
    {
      label: "In Progress",
      value: activeWorkOrders.filter((t) => t.status === "in_progress").length,
      icon: Timer,
      variant: "default" as const,
    },
    {
      label: "Completed",
      value: resolvedWorkOrders.length,
      icon: CheckCircle2,
      variant: "success" as const,
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {showSuccess && <SuccessToast />}

      <PageLayout
        id="my-tickets-page"
        title="My Tickets"
        subtitle="Request History"
        description="TRACK STATUS AND UPDATES FOR ISSUES YOU'VE REPORTED"
        bgSymbol="MT"
        headerActions={
          <Button
            size="sm"
            className="h-9 text-[10px] font-black uppercase tracking-widest"
            asChild
          >
            <Link href="/">
              <Plus className="mr-2 h-3.5 w-3.5" />
              NEW REQUEST
            </Link>
          </Button>
        }
        stats={<StatsTicker variant="compact" stats={stats} />}
      >
        {userWorkOrders.length === 0 ? (
          <div className="bg-card p-12 rounded-3xl border-2 border-dashed border-muted shadow-sm flex items-center justify-center">
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
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="bg-muted/50 p-1 border-2 border-border/50 h-11 w-full sm:w-auto">
              <TabsTrigger
                value="active"
                className="flex-1 sm:flex-none rounded-lg px-3 sm:px-6 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Active ({activeWorkOrders.length})
              </TabsTrigger>
              <TabsTrigger
                value="resolved"
                className="flex-1 sm:flex-none rounded-lg px-3 sm:px-6 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Resolved ({resolvedWorkOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="active"
              className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300"
            >
              {activeWorkOrders.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                  {activeWorkOrders.map((workOrder, index) => (
                    <WorkOrderCard
                      key={workOrder.id}
                      workOrder={workOrder}
                      index={index}
                      variant="compact"
                      href={`/my-tickets/${workOrder.id}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-muted/20 p-12 rounded-2xl border border-dashed border-muted text-center italic text-muted-foreground text-sm">
                  No active requests. Everything is running smoothly.
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="resolved"
              className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300"
            >
              {resolvedWorkOrders.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 opacity-90 grayscale-[0.2]">
                  {resolvedWorkOrders.map((workOrder, index) => (
                    <WorkOrderCard
                      key={workOrder.id}
                      workOrder={workOrder}
                      index={index}
                      variant="compact"
                      href={`/my-tickets/${workOrder.id}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-muted/20 p-12 rounded-2xl border border-dashed border-muted text-center italic text-muted-foreground text-sm">
                  No resolved tickets yet.
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </PageLayout>
    </div>
  );
}
