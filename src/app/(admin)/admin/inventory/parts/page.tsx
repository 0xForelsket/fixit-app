import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { spareParts } from "@/db/schema";
import { cn } from "@/lib/utils";
import { desc } from "drizzle-orm";
import { ArrowLeft, ChevronRight, Package, Plus, Search } from "lucide-react";
import Link from "next/link";

type SearchParams = {
  search?: string;
  category?: string;
  filter?: string;
};

async function getParts(params: SearchParams) {
  let allParts = await db.query.spareParts.findMany({
    orderBy: [desc(spareParts.createdAt)],
  });

  // Filter by active status
  if (params.filter !== "all") {
    allParts = allParts.filter((p) => p.isActive);
  }

  // Filter by search
  if (params.search) {
    const search = params.search.toLowerCase();
    allParts = allParts.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        p.barcode?.toLowerCase().includes(search)
    );
  }

  // Filter by category
  if (params.category && params.category !== "all") {
    allParts = allParts.filter((p) => p.category === params.category);
  }

  return allParts;
}

const categories = [
  "electrical",
  "mechanical",
  "hydraulic",
  "pneumatic",
  "consumable",
  "safety",
  "tooling",
  "other",
];

export default async function PartsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const parts = await getParts(params);

  // Stats
  const totalParts = parts.length;
  const categoryCounts = categories.reduce(
    (acc, cat) => {
      acc[cat] = parts.filter((p) => p.category === cat).length;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Parts Catalog</h1>
            <p className="text-muted-foreground">{totalParts} parts</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/admin/inventory/parts/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Part
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <form
          action="/admin/inventory/parts"
          className="relative flex-1 md:max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="search"
            placeholder="Search parts by name, SKU, or barcode..."
            defaultValue={params.search}
            className="w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </form>
        <div className="flex flex-wrap gap-2">
          <FilterLink
            href="/admin/inventory/parts"
            active={!params.category || params.category === "all"}
          >
            All
          </FilterLink>
          {categories.map((cat) => (
            <FilterLink
              key={cat}
              href={`/admin/inventory/parts?category=${cat}`}
              active={params.category === cat}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}{" "}
              {categoryCounts[cat] > 0 && (
                <span className="text-muted-foreground">
                  ({categoryCounts[cat]})
                </span>
              )}
            </FilterLink>
          ))}
        </div>
      </div>

      {/* Parts List */}
      {parts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No parts found</h3>
          <p className="text-sm text-muted-foreground">
            {params.search || params.category
              ? "Try adjusting your filters"
              : "Add your first spare part to get started"}
          </p>
          <Button className="mt-4" asChild>
            <Link href="/admin/inventory/parts/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Part
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr className="text-left font-medium text-muted-foreground">
                <th className="p-3">Part</th>
                <th className="p-3 hidden md:table-cell">SKU</th>
                <th className="p-3 hidden lg:table-cell">Category</th>
                <th className="p-3 hidden sm:table-cell">Unit Cost</th>
                <th className="p-3 hidden md:table-cell">Reorder Point</th>
                <th className="p-3">Status</th>
                <th className="p-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {parts.map((part) => (
                <tr
                  key={part.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                        <Package className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium">{part.name}</p>
                        {part.barcode && (
                          <p className="text-xs text-muted-foreground">
                            Barcode: {part.barcode}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell font-mono text-muted-foreground">
                    {part.sku}
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    <Badge variant="secondary" className="capitalize">
                      {part.category}
                    </Badge>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    {part.unitCost ? `$${part.unitCost.toFixed(2)}` : "-"}
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">
                    {part.reorderPoint}
                  </td>
                  <td className="p-3">
                    <Badge variant={part.isActive ? "success" : "secondary"}>
                      {part.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/inventory/parts/${part.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary-100 text-primary-700"
          : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
