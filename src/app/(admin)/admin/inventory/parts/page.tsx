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
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center bg-white shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 border shadow-inner">
            <Package className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="mt-4 text-lg font-black uppercase tracking-tight">
            No parts found
          </h3>
          <p className="text-sm text-zinc-500 font-medium font-mono">
            {params.search || params.category
              ? "ADJUST FILTERS AND RETRY"
              : "COMMENCE CATALOGING"}
          </p>
          <Button
            className="mt-6 rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-95"
            asChild
          >
            <Link href="/admin/inventory/parts/new">
              <Plus className="mr-2 h-4 w-4" />
              Initial Entry
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden rounded-xl border-2 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b bg-zinc-50">
                <tr className="text-left font-black uppercase tracking-widest text-[10px] text-zinc-500">
                  <th className="p-4">Part</th>
                  <th className="p-4 md:table-cell">SKU</th>
                  <th className="p-4 lg:table-cell">Category</th>
                  <th className="p-4 sm:table-cell">Unit Cost</th>
                  <th className="p-4 md:table-cell">Reorder Point</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {parts.map((part) => (
                  <tr
                    key={part.id}
                    className="hover:bg-zinc-50 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 border-2 border-transparent group-hover:border-primary-200 transition-all">
                          <Package className="h-5 w-5 text-zinc-600" />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 leading-tight uppercase tracking-tight">
                            {part.name}
                          </p>
                          {part.barcode && (
                            <p className="text-[10px] font-mono text-zinc-400">
                              SN: {part.barcode}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 md:table-cell font-mono text-xs font-bold text-zinc-500">
                      {part.sku}
                    </td>
                    <td className="p-4 lg:table-cell">
                      <Badge
                        variant="secondary"
                        className="capitalize font-mono text-[10px]"
                      >
                        {part.category}
                      </Badge>
                    </td>
                    <td className="p-4 sm:table-cell font-bold text-zinc-700">
                      {part.unitCost ? `$${part.unitCost.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-4 md:table-cell text-zinc-500 font-mono text-xs font-bold">
                      {part.reorderPoint}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={part.isActive ? "success" : "secondary"}
                        className="font-black uppercase tracking-tighter text-[10px]"
                      >
                        {part.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/admin/inventory/parts/${part.id}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-100 hover:text-primary-600 transition-all"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {parts.map((part) => (
              <Link
                key={part.id}
                href={`/admin/inventory/parts/${part.id}`}
                className="block rounded-2xl border-2 bg-white p-4 shadow-sm active:scale-[0.98] transition-all hover:border-primary-100"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-zinc-50 border-2 flex items-center justify-center text-zinc-400">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight text-zinc-900 leading-none mb-1">
                        {part.name}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-zinc-400">
                        SKU: {part.sku}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={part.isActive ? "success" : "secondary"}
                    className="text-[9px] font-black uppercase px-2 py-0 border-2"
                  >
                    {part.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-100">
                  <div className="bg-zinc-50 rounded-lg p-2 text-center border">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">
                      Category
                    </p>
                    <p className="text-xs font-bold uppercase text-zinc-700">
                      {part.category}
                    </p>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-2 text-center border text-zinc-700">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">
                      Unit Cost
                    </p>
                    <p className="text-xs font-black">
                      ${part.unitCost?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <span>Barcode: {part.barcode || "—"}</span>
                  <span className="flex items-center gap-1 text-primary-600 font-black">
                    Details <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
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
