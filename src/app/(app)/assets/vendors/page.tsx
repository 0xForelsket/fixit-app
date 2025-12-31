import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLayout } from "@/components/ui/page-layout";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { VendorFilters } from "@/components/vendors/vendor-filters";
import { VendorsTable } from "@/components/vendors/vendors-table";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { asc, desc, like, or } from "drizzle-orm";
import { Building, Factory, Plus, Users } from "lucide-react";
import Link from "next/link";

type SearchParams = {
  q?: string;
  sort?: "name" | "code" | "contactPerson" | "phone" | "email";
  dir?: "asc" | "desc";
};

async function getVendorStats() {
  const allVendors = await db.query.vendors.findMany();
  const activeVendors = allVendors.filter((v) => v.isActive);
  return {
    total: allVendors.length,
    active: activeVendors.length,
  };
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
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

  const stats = await getVendorStats();

  return (
    <PageLayout
      title="Vendor Registry"
      subtitle="Supply Chain"
      description={`${stats.total} VENDORS • ${stats.active} ACTIVE`}
      bgSymbol="VN"
      headerActions={
        <Button
          asChild
          className="rounded-full font-black text-[10px] uppercase tracking-wider h-11 px-8 shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
        >
          <Link href="/assets/vendors/new">
            <Plus className="mr-2 h-4 w-4" />
            ADD VENDOR
          </Link>
        </Button>
      }
      stats={
        <StatsTicker
          stats={[
            {
              label: "Total Vendors",
              value: stats.total,
              icon: Building,
              variant: "default",
            },
            {
              label: "Active Partners",
              value: stats.active,
              icon: Users,
              variant: "success",
            },
          ]}
        />
      }
      filters={<VendorFilters searchParams={params} />}
    >
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
    </PageLayout>
  );
}
