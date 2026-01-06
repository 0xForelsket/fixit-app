import { PageLayout } from "@/components/ui/page-layout";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { ImportWizard } from "./import-wizard";

export default async function ImportPage() {
  await requirePermission(PERMISSIONS.EQUIPMENT_CREATE);

  return (
    <PageLayout
      id="import-page"
      title="Bulk Import"
      subtitle="Data Migration"
      description="IMPORT EQUIPMENT FROM CSV FILES"
      bgSymbol="IM"
    >
      <ImportWizard />
    </PageLayout>
  );
}
