import { PageLayout } from "@/components/ui/page-layout";
import { SkeletonTable } from "@/components/ui/skeleton";

export default function WorkOrdersLoading() {
	return (
		<PageLayout
			title="Work Orders"
			subtitle="Maintenance Queue"
			description="LOADING WORK ORDERS..."
			bgSymbol="WO"
			stats={
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 opacity-50">
					{[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="h-20 bg-card animate-pulse rounded-xl border border-border"
						/>
					))}
				</div>
			}
		>
			<div className="space-y-4">
				<div className="flex flex-col sm:flex-row gap-4 justify-between">
					<div className="flex gap-2">
						<div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
						<div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
						<div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
					</div>
					<div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
				</div>
				<SkeletonTable rows={10} cols={6} />
			</div>
		</PageLayout>
	);
}
