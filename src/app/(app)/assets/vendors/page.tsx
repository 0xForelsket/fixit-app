import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SortHeader } from "@/components/ui/sort-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <SortHeader
                  label="Code"
                  field="code"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                />
                <SortHeader
                  label="Name"
                  field="name"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                />
                <SortHeader
                  label="Contact"
                  field="contactPerson"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="hidden md:table-cell"
                />
                <SortHeader
                  label="Phone"
                  field="phone"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="hidden sm:table-cell"
                />
                <SortHeader
                  label="Email"
                  field="email"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="hidden lg:table-cell"
                />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorList.map((vendor) => (
                <TableRow key={vendor.id} className="group">
                  <TableCell className="font-mono text-xs font-medium">
                    {vendor.code}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/assets/vendors/${vendor.id}`}
                      className="hover:underline decoration-primary underline-offset-4"
                    >
                      {vendor.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {vendor.contactPerson || "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {vendor.phone || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {vendor.email || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      asChild
                    >
                      <Link href={`/assets/vendors/${vendor.id}`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
