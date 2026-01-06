import { getReportTemplate } from "@/actions/reports";
import { ReportBuilder } from "@/components/reports/builder/report-builder";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import type { ReportConfig } from "@/components/reports/builder/types";

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const rawTemplate = id ? await getReportTemplate(id) : undefined;

  const template = rawTemplate
    ? {
        id: rawTemplate.id,
        config: rawTemplate.config as unknown as ReportConfig,
      }
    : undefined;
  // TODO: Implement proper user session
  const userId = "user_01HKQ...";

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
      <ReportBuilder initialTemplate={template} userId={userId} />
    </PageLayout>
  );
}
