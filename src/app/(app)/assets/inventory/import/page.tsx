import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { ArrowLeft, FileSpreadsheet, Lock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CSVImportForm } from "./csv-import-form";

export default async function ImportPartsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const canImport = hasPermission(
    user.permissions,
    PERMISSIONS.INVENTORY_CREATE
  );

  return (
    <PageLayout
      id="import-parts-page"
      title="Import Parts"
      subtitle="Bulk Data Import"
      description="UPLOAD CSV FILE TO BULK IMPORT PARTS INTO INVENTORY"
      bgSymbol="IM"
      headerActions={
        <Button variant="outline" asChild className="rounded-full">
          <Link href="/assets/inventory">
            <ArrowLeft className="mr-2 h-4 w-4" />
            BACK TO INVENTORY
          </Link>
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        {canImport ? (
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <div className="h-10 w-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black uppercase tracking-tight">
                  CSV Parts Import
                </h2>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file to create multiple parts at once
                </p>
              </div>
            </div>

            <CSVImportForm />
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-danger-200 bg-danger-50/50 p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-2xl bg-danger-100 text-danger-600 flex items-center justify-center mb-4">
                <Lock className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-danger-900 mb-2">
                Access Denied
              </h2>
              <p className="text-muted-foreground max-w-md mb-6">
                You do not have permission to import inventory data. Please
                contact your administrator if you need access to this feature.
              </p>
              <Button asChild variant="outline">
                <Link href="/assets/inventory">Return to Inventory</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
