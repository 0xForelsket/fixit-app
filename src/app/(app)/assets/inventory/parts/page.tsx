import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { spareParts } from "@/db/schema";
import { cn } from "@/lib/utils";
import { desc } from "drizzle-orm";
import { ArrowLeft, ChevronRight, Package, Plus, Search, Upload } from "lucide-react";
import Link from "next/link";

type SearchParams = {
  search?: string;
  category?: string;
  filter?: string;
  sort?: "name" | "sku" | "category" | "unitCost" | "status";
  dir?: "asc" | "desc";
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

  if (params.sort) {
    allParts.sort((a, b) => {
      let valA: string | number | boolean = "";
      let valB: string | number | boolean = "";

      switch (params.sort) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "sku":
          valA = a.sku.toLowerCase();
          valB = b.sku.toLowerCase();
          break;
        case "category":
          valA = a.category.toLowerCase();
          valB = b.category.toLowerCase();
          break;
        case "unitCost":
          valA = a.unitCost || 0;
          valB = b.unitCost || 0;
          break;
        case "status":
          valA = a.isActive ? 1 : 0;
          valB = b.isActive ? 1 : 0;
          break;
      }

      if (valA < valB) return params.dir === "desc" ? 1 : -1;
      if (valA > valB) return params.dir === "desc" ? -1 : 1;
      return 0;
    });
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
  "cleaning",
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
      <div className="flex items-center justify-between border-b border-border pb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-primary">
            <Link href="/assets/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase font-serif-brand">
              Parts <span className="text-primary">Catalog</span>
            </h1>
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              <Package className="h-3.5 w-3.5" />
              {totalParts} REGISTERED MODULES
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/import?type=spare-parts">
              <Upload className="mr-2 h-4 w-4" />
              BULK IMPORT
            </Link>
          </Button>
          <Button asChild>
            <Link href="/assets/inventory/parts/new">
              <Plus className="mr-2 h-4 w-4" />
              ADD PART
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <form
          action="/assets/inventory/parts"
          className="relative flex-1 md:max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="search"
            placeholder="Search parts by name, SKU, or barcode..."
            defaultValue={params.search}
            className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </form>
        <div className="flex flex-wrap gap-2">
          <FilterLink
            href="/assets/inventory/parts"
            active={!params.category || params.category === "all"}
          >
            All
          </FilterLink>
          {categories.map((cat) => (
            <FilterLink
              key={cat}
              href={`/assets/inventory/parts?category=${cat}`}
              active={params.category === cat}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}{" "}
              {categoryCounts[cat] > 0 && (
                <span className="text-[10px] opacity-70 ml-1">
                  {categoryCounts[cat]}
                </span>
              )}
            </FilterLink>
          ))}
        </div>
      </div>

      {/* Parts List */}
      {parts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-12 text-center bg-card shadow-sm shadow-border/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted border border-border shadow-inner">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-black uppercase tracking-tight text-foreground">
            No parts found
          </h3>
          <p className="text-sm text-muted-foreground font-medium font-mono">
            {params.search || params.category
              ? "ADJUST FILTERS AND RETRY"
              : "COMMENCE CATALOGING"}
          </p>
          <Button
            className="mt-6 rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-95"
            asChild
          >
            <Link href="/assets/inventory/parts/new">
              <Plus className="mr-2 h-4 w-4" />
              Initial Entry
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors">
            <Table className="w-full text-sm">
              <TableHeader className="bg-muted/50">
                <TableRow className="border-b border-border text-left font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:bg-transparent">
                  <SortHeader
                    label="Part"
                    field="name"
                    currentSort={params.sort}
                    currentDir={params.dir}
                    params={params}
                    className="p-4"
                  />
                  <SortHeader
                    label="SKU"
                    field="sku"
                    currentSort={params.sort}
                    currentDir={params.dir}
                    params={params}
                    className="p-4 md:table-cell"
                  />
                  <SortHeader
                    label="Category"
                    field="category"
                    currentSort={params.sort}
                    currentDir={params.dir}
                    params={params}
                    className="p-4 lg:table-cell"
                  />
                  <SortHeader
                    label="Unit Cost"
                    field="unitCost"
                    currentSort={params.sort}
                    currentDir={params.dir}
                    params={params}
                    className="p-4 sm:table-cell"
                  />
                  <TableHead className="p-4 md:table-cell">
                    Reorder Point
                  </TableHead>
                  <SortHeader
                    label="Status"
                    field="status"
                    currentSort={params.sort}
                    currentDir={params.dir}
                    params={params}
                    className="p-4"
                  />
                  <TableHead className="p-4 w-10" />
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {parts.map((part) => (
                  <TableRow
                    key={part.id}
                    className="hover:bg-muted/50 transition-colors group"
                  >
                    <TableCell className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border group-hover:border-primary/50 transition-all">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground leading-tight uppercase tracking-tight">
                            {part.name}
                          </p>
                          {part.barcode && (
                            <p className="text-[10px] font-mono text-muted-foreground">
                              SN: {part.barcode}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-4 md:table-cell font-mono text-xs font-bold text-muted-foreground">
                      {part.sku}
                    </TableCell>
                    <TableCell className="p-4 lg:table-cell">
                      <Badge
                        variant="secondary"
                        className="capitalize font-mono text-[10px] font-bold"
                      >
                        {part.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4 sm:table-cell font-bold text-foreground/80">
                      {part.unitCost ? `$${part.unitCost.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="p-4 md:table-cell text-muted-foreground font-mono text-xs font-bold">
                      {part.reorderPoint}
                    </TableCell>
                    <TableCell className="p-4">
                      <Badge
                        variant={part.isActive ? "success" : "secondary"}
                        className="font-black uppercase tracking-wider text-[10px]"
                      >
                        {part.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4">
                      <Link
                        href={`/assets/inventory/parts/${part.id}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary transition-all"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {parts.map((part) => (
              <Link
                key={part.id}
                href={`/assets/inventory/parts/${part.id}`}
                className="block rounded-2xl border border-border bg-card p-4 shadow-sm active:scale-[0.98] transition-all hover:border-primary/30"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight text-foreground leading-none mb-1">
                        {part.name}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-muted-foreground">
                        SKU: {part.sku}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={part.isActive ? "success" : "secondary"}
                    className="text-[9px] font-black uppercase px-2 py-0 border"
                  >
                    {part.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
                  <div className="bg-muted rounded-lg p-2 text-center border border-border">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
                      Category
                    </p>
                    <p className="text-xs font-bold uppercase text-foreground/80">
                      {part.category}
                    </p>
                  </div>
                  <div className="bg-muted rounded-lg p-2 text-center border border-border text-foreground/80">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
                      Unit Cost
                    </p>
                    <p className="text-xs font-black">
                      ${part.unitCost?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Barcode: {part.barcode || "—"}</span>
                  <span className="flex items-center gap-1 text-primary font-black">
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
        "rounded-lg px-3 py-2 text-xs font-black uppercase tracking-widest transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
