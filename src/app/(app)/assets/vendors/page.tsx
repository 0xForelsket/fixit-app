import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
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
import { desc, like, or } from "drizzle-orm";
import { Factory, Plus, Search } from "lucide-react";
import Link from "next/link";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q;

  const vendorList = await db.query.vendors.findMany({
    where: query
      ? or(like(vendors.name, `%${query}%`), like(vendors.code, `%${query}%`))
      : undefined,
    orderBy: [desc(vendors.createdAt)],
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
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
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
