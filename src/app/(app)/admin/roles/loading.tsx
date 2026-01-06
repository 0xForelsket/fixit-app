import { PageHeader } from "@/components/ui/page-header";
import { SkeletonTable } from "@/components/ui/skeleton";

export default function RolesLoading() {
	return (
		<div className="space-y-10 animate-in">
			<PageHeader
				title="Role Management"
				subtitle="Access Control"
				description="LOADING ROLES..."
				bgSymbol="RL"
			/>

			<div className="space-y-4">
				<div className="flex justify-end">
					<div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
				</div>
				<SkeletonTable rows={5} cols={4} />
			</div>
		</div>
	);
}
