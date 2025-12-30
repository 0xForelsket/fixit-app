import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { VendorsTable } from "@/components/vendors/vendors-table";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { asc, desc, like, or } from "drizzle-orm";
import { Factory, Plus, Search } from "lucide-react";
import Link from "next/link";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sort?: "name" | "code" | "contactPerson" | "phone" | "email";
    dir?: "asc" | "desc";
  }>;
}) {
  const params = await searchParams;
  const query = params.q;

  const orderBy = [];
  if (params.sort) {
    const direction = params.dir === "asc" ? asc : desc;
    switch (params.sort) {
      case "name":
        orderBy.push(direction(vendors.name));
        break;
      case "code":
        orderBy.push(direction(vendors.code));
        break;
      case "contactPerson":
        orderBy.push(direction(vendors.contactPerson));
        break;
      case "phone":
        orderBy.push(direction(vendors.phone));
        break;
      case "email":
        orderBy.push(direction(vendors.email));
        break;
    }
  }

  // Default sort
  if (orderBy.length === 0) {
    orderBy.push(desc(vendors.createdAt));
  }

  const vendorList = await db.query.vendors.findMany({
    where: query
      ? or(like(vendors.name, `%${query}%`), like(vendors.code, `%${query}%`))
      : undefined,
    orderBy,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        subtitle="Assets"
        description="Manage suppliers and service providers."
        actions={
          <Button asChild>
            <Link href="/assets/vendors/new">
              <Plus className="mr-2 h-4 w-4" />
              New Vendor
            </Link>
          </Button>
        }
      />

      {/* Simple Search */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <form>
            <input
              name="q"
              placeholder="Search vendors..."
              defaultValue={query}
              className="w-full rounded-lg border bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </form>
        </div>
      </div>

      {vendorList.length === 0 ? (
        <EmptyState
          title="No vendors found"
          description="Get started by adding your first supplier or service provider."
          icon={Factory}
        >
          <Button asChild>
            <Link href="/assets/vendors/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <VendorsTable vendors={vendorList} searchParams={params} />
      )}
    </div>
  );
}
