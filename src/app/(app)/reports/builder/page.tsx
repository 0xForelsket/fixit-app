import { getReportTemplate } from "@/actions/reports";
import { ReportBuilder } from "@/components/reports/builder/report-builder";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const template = id ? await getReportTemplate(id) : null;
  // TODO: Implement proper user session
  const userId = "user_01HKQ..."; 

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/reports">
            <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Reports
            </Button>
        </Link>
      </div>
      <PageHeader
        title={template ? "Edit Report Template" : "New Custom Report"}
        subtitle="Report Builder"
        description="Design your custom report layout by dragging and dropping widgets."
        bgSymbol="RB"
      />
      
      <div className="mt-8">
        <ReportBuilder initialTemplate={template} userId={userId} />
      </div>
    </PageContainer>
  );
}
