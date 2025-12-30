import { VendorForm } from "@/components/assets/vendor-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewVendorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Vendor"
        description="Add a new supplier or service provider"
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
        <VendorForm />
      </div>
    </div>
  );
}
