import { VendorForm } from "@/components/assets/vendor-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendorId = Number.parseInt(id);

  if (Number.isNaN(vendorId)) {
    notFound();
  }

  const vendor = await db.query.vendors.findFirst({
    where: eq(vendors.id, vendorId),
  });

  if (!vendor) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={vendor.name}
        subtitle="Edit Vendor"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/assets/vendors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vendors
            </Link>
          </Button>
        }
      />
      <div className="max-w-2xl">
        <VendorForm vendor={vendor} />
      </div>
    </div>
  );
}
