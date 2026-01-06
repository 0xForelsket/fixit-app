import { PageHeader } from "@/components/ui/page-header";
import { SkeletonTable } from "@/components/ui/skeleton";

export default function DocumentsLoading() {
	return (
		<div className="space-y-10 animate-in">
			<PageHeader
				title="Document Center"
				subtitle="File Management"
				description="LOADING DOCUMENTS..."
				bgSymbol="DC"
			/>

			<div className="space-y-4">
				<div className="flex flex-col sm:flex-row gap-4 justify-between">
					<div className="flex gap-2">
						<div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
						<div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
					</div>
					<div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
				</div>
				<SkeletonTable rows={8} cols={5} />
			</div>
		</div>
	);
}
