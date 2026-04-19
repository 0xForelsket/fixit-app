import { getReportTemplate } from "@/actions/reports";
import { ReportBuilder } from "@/components/reports/builder/report-builder";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requirePermission(PERMISSIONS.REPORTS_VIEW);

  const { id } = await searchParams;
  const templateResult = id ? await getReportTemplate(id) : undefined;
  if (
    id &&
    (!templateResult || !templateResult.success || !templateResult.data)
  ) {
    notFound();
  }

  const template = templateResult?.success ? templateResult.data : undefined;

  return (
    <PageLayout
      id="report-builder-page"
      title={template ? "Edit Report Template" : "New Custom Report"}
      subtitle="Report Builder"
      description="DESIGN YOUR CUSTOM REPORT LAYOUT BY DRAGGING AND DROPPING WIDGETS"
      bgSymbol="RB"
      headerActions={
        <Link href="/reports">
          <Button
            variant="ghost"
            size="sm"
            className="pl-0 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
        </Link>
      }
    >
      <ReportBuilder initialTemplate={template} />
    </PageLayout>
  );
}
