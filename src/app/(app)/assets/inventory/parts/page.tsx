import { PartsFilters } from "@/components/inventory/parts-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLayout } from "@/components/ui/page-layout";
import { SortHeader } from "@/components/ui/sort-header";
import { StatsTicker } from "@/components/ui/stats-ticker";
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
import { desc } from "drizzle-orm";
import { Box, ChevronRight, Package, Plus, Upload } from "lucide-react";
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

async function getPartStats() {
  const allParts = await db.query.spareParts.findMany();
  const activeParts = allParts.filter((p) => p.isActive);
  const totalValue = allParts.reduce((sum, p) => sum + (p.unitCost || 0), 0);
  return {
    total: allParts.length,
    active: activeParts.length,
    totalValue,
  };
}

export default async function PartsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const parts = await getParts(params);
  const stats = await getPartStats();

  return (
    <PageLayout
      title="Parts Catalog"
      subtitle="Inventory Management"
      description={`${stats.total} REGISTERED MODULES • ${stats.active} ACTIVE`}
      bgSymbol="PT"
      headerActions={
        <>
          <Button variant="outline" asChild>
            <Link href="/assets/inventory/import">
              <Upload className="mr-2 h-4 w-4" />
              BULK IMPORT
            </Link>
          </Button>
          <Button
            asChild
            className="rounded-full font-black text-[10px] uppercase tracking-wider h-11 px-8 shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
          >
            <Link href="/assets/inventory/parts/new">
              <Plus className="mr-2 h-4 w-4" />
              ADD PART
            </Link>
          </Button>
        </>
      }
      stats={
        <StatsTicker
          stats={[
            {
              label: "Total Parts",
              value: stats.total,
              icon: Package,
              variant: "default",
            },
            {
              label: "Active SKUs",
              value: stats.active,
              icon: Box,
              variant: "success",
            },
          ]}
        />
      }
      filters={<PartsFilters searchParams={params} />}
    >
      {parts.length === 0 ? (
        <EmptyState
          title="No parts found"
          description={
            params.search || params.category
              ? "Adjust filters and retry"
              : "Commence cataloging"
          }
          icon={Package}
        >
          <Button
            className="rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-95"
            asChild
          >
            <Link href="/assets/inventory/parts/new">
              <Plus className="mr-2 h-4 w-4" />
              Initial Entry
            </Link>
          </Button>
        </EmptyState>
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
    </PageLayout>
  );
}
