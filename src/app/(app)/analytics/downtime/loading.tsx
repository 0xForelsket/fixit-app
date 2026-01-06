import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonStatsGrid } from "@/components/ui/skeleton";

export default function DowntimeLoading() {
	return (
		<PageContainer>
			<PageHeader
				title="Downtime Analytics"
				subtitle="Reliability Metrics"
				description="LOADING DOWNTIME DATA..."
				bgSymbol="DT"
			/>

			<div className="space-y-8">
				<div className="flex gap-4">
					<div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
					<div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
				</div>

				<SkeletonStatsGrid />

				<div className="grid gap-6 lg:grid-cols-2">
					<div className="h-[350px] bg-card animate-pulse rounded-xl border border-border" />
					<div className="h-[350px] bg-card animate-pulse rounded-xl border border-border" />
				</div>

				<div className="h-[300px] bg-card animate-pulse rounded-xl border border-border" />
			</div>
		</PageContainer>
	);
}
