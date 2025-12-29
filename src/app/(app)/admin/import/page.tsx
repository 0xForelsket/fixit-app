import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { ImportWizard } from "./import-wizard";

export default async function ImportPage() {
  await requirePermission(PERMISSIONS.EQUIPMENT_CREATE);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 uppercase">
            Bulk <span className="text-primary-600">Import</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Import equipment from CSV files
          </p>
        </div>
      </div>

      <ImportWizard />
    </div>
  );
}
