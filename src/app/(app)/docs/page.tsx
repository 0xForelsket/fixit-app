import { PageLayout } from "@/components/ui/page-layout";

export default function DocsPage() {
  return (
    <PageLayout
      id="docs-page"
      title="Documentation"
      subtitle="Resource Center"
      description="SYSTEM DOCUMENTATION AND GUIDES"
      bgSymbol="DC"
    >
      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground">
          Documentation is currently under development.
        </p>
      </div>
    </PageLayout>
  );
}
