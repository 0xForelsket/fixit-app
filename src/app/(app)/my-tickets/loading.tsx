import { PageLayout } from "@/components/ui/page-layout";
import { SkeletonTicketList } from "@/components/ui/skeleton";

export default function MyTicketsLoading() {
  return (
    <PageLayout
      id="my-tickets-page"
      title="My Tickets"
      subtitle="Request History"
      description="LOADING YOUR TICKETS..."
      bgSymbol="MT"
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
          <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
          <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
        </div>
        <SkeletonTicketList count={6} />
      </div>
    </PageLayout>
  );
}
