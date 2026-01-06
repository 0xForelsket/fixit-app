import { PageHeader } from "@/components/ui/page-header";
import { SkeletonTicketList } from "@/components/ui/skeleton";

export default function MyTicketsLoading() {
	return (
		<div className="space-y-10 animate-in">
			<PageHeader
				title="My Tickets"
				subtitle="Assigned Tasks"
				description="LOADING YOUR TICKETS..."
				bgSymbol="MT"
			/>

			<div className="space-y-4">
				<div className="flex gap-2">
					<div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
					<div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
					<div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
				</div>
				<SkeletonTicketList count={6} />
			</div>
		</div>
	);
}
