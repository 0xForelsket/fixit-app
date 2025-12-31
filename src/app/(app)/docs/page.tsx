import { PageHeader } from "@/components/ui/page-header";

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Documentation" subtitle="Resource Center" />
      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground">
          Documentation is currently under development.
        </p>
      </div>
    </div>
  );
}
