
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
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
import { ViewToggle } from "@/components/ui/view-toggle";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { cn, formatRelativeTime } from "@/lib/utils";
import { desc } from "drizzle-orm";
import {
  Building,
  ChevronRight,
  Edit,
  FolderTree,
  MapPin,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { LocationTree } from "./location-tree";

type SearchParams = {
  search?: string;
  sort?: "name" | "code" | "parent" | "status" | "createdAt";
  dir?: "asc" | "desc";
  view?: "list" | "tree";
};

async function getLocations(params: SearchParams) {
  const locationsList = await db.query.locations.findMany({
    orderBy: [desc(locations.createdAt)],
    with: {
      parent: true,
    },
  });

  let filtered = locationsList;

  if (params.search) {
    filtered = filtered.filter(
      (l) =>
        l.name.toLowerCase().includes(params.search!.toLowerCase()) ||
        l.code.toLowerCase().includes(params.search!.toLowerCase())
    );
  }

  if (params.sort) {
    filtered.sort((a, b) => {
      let valA: string | number | boolean = "";
      let valB: string | number | boolean = "";

      switch (params.sort) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "code":
          valA = a.code.toLowerCase();
          valB = b.code.toLowerCase();
          break;
        case "parent":
          valA = a.parent?.name.toLowerCase() || "";
          valB = b.parent?.name.toLowerCase() || "";
          break;
        case "status":
          valA = a.isActive ? 1 : 0;
          valB = b.isActive ? 1 : 0;
          break;
        case "createdAt":
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
          break;
      }

      if (valA < valB) return params.dir === "desc" ? 1 : -1;
      if (valA > valB) return params.dir === "desc" ? -1 : 1;
      return 0;
    });
  }

  // Separate root locations and children
  const roots = filtered.filter((l) => !l.parentId);
  const children = filtered.filter((l) => l.parentId);

  return { all: filtered, roots, children };
}

async function getLocationStats() {
  const allLocations = await db.query.locations.findMany();
  const rootLocations = allLocations.filter((l) => !l.parentId);
  const activeLocations = allLocations.filter((l) => l.isActive);
  return {
    total: allLocations.length,
    roots: rootLocations.length,
    active: activeLocations.length,
  };
}

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { all: locationsList } = await getLocations(params);
  const stats = await getLocationStats();

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Facility Locations"
        subtitle="Infrastructure Mapping"
        description={`${stats.total} ZONES • ${stats.roots} ROOT AREAS`}
        bgSymbol="LO"
        actions={
          <>
            <ViewToggle />
            <div className="w-px h-8 bg-border mx-2 hidden lg:block" />
            <Button
              variant="outline"
              asChild
              className="rounded-full border-2 font-black text-[10px] uppercase tracking-wider h-11 px-6 hover:bg-muted transition-all"
            >
              <Link href="/admin/import?type=locations">
                <Upload className="mr-2 h-4 w-4" />
                BULK IMPORT
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-full font-black text-[10px] uppercase tracking-wider h-11 px-8 shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
            >
              <Link href="/assets/locations/new">
                <Plus className="mr-2 h-4 w-4" />
                ADD LOCATION
              </Link>
            </Button>
          </>
        }
      />

      {/* Stats Ticker */}
      <StatsTicker
        stats={[
          {
            label: "Total Locations",
            value: stats.total,
            icon: MapPin,
            variant: "default",
          },
          {
            label: "Root Areas",
            value: stats.roots,
            icon: Building,
            variant: "default",
          },
          {
            label: "Active Zones",
            value: stats.active,
            icon: FolderTree,
            variant: "success",
          },
        ]}
      />

      {/* Search */}
      <div className="flex items-center gap-3">
        <form
          className="flex-1 max-w-md"
          action="/assets/locations"
          method="get"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="search"
              placeholder="SEARCH BY NAME OR CODE..."
              defaultValue={params.search}
              className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-xs font-bold tracking-wider placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all uppercase"
            />
          </div>
        </form>
      </div>

      {params.view === "tree" ? (
        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-xl shadow-border/20 overflow-hidden">
          <Suspense
            fallback={
              <div className="h-96 animate-pulse bg-muted rounded-2xl" />
            }
          >
            <LocationTree initialLocations={locationsList} />
          </Suspense>
        </div>
      ) : (
        <>
          {/* Locations Table */}
          {locationsList.length === 0 ? (
            <EmptyState
              title="No locations found"
              description={
                params.search
                  ? "Try adjusting your search to find the zones you're looking for."
                  : "Define your first physical or virtual location to begin mapping assets."
              }
              icon={MapPin}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-border/20">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <SortHeader
                      label="Location"
                      field="name"
                      currentSort={params.sort}
                      currentDir={params.dir}
                      params={params}
                      className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                    />
                    <SortHeader
                      label="Code"
                      field="code"
                      currentSort={params.sort}
                      currentDir={params.dir}
                      params={params}
                      className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell"
                    />
                    <SortHeader
                      label="Parent"
                      field="parent"
                      currentSort={params.sort}
                      currentDir={params.dir}
                      params={params}
                      className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell"
                    />
                    <SortHeader
                      label="Status"
                      field="status"
                      currentSort={params.sort}
                      currentDir={params.dir}
                      params={params}
                      className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                    />
                    <SortHeader
                      label="Created"
                      field="createdAt"
                      currentSort={params.sort}
                      currentDir={params.dir}
                      params={params}
                      className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden sm:table-cell"
                    />
                    <TableHead className="p-5 w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {locationsList.map((location, index) => {
                    const staggerClass =
                      index < 5
                        ? `animate-stagger-${index + 1}`
                        : "animate-in fade-in duration-500";
                    return (
                      <TableRow
                        key={location.id}
                        className={cn(
                          "hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-bottom-1",
                          staggerClass
                        )}
                      >
                        <TableCell className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border shadow-sm">
                              <MapPin className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-sm font-serif-brand">
                                {location.name}
                              </p>
                              {location.description && (
                                <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground line-clamp-1 mt-0.5">
                                  {location.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-5 hidden md:table-cell">
                          <span className="font-mono font-bold text-xs text-muted-foreground uppercase tracking-widest">
                            {location.code}
                          </span>
                        </TableCell>
                        <TableCell className="p-5 hidden lg:table-cell">
                          {location.parent ? (
                            <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                              {location.parent.name}
                            </div>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/50 bg-muted/50 px-2 py-1 rounded">
                              ROOT
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="p-5">
                          {location.isActive ? (
                            <span className="inline-flex items-center rounded-full border border-success-500/30 bg-success-500/10 px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase text-success-700">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="p-5 hidden sm:table-cell">
                          <span className="text-sm font-mono text-muted-foreground">
                            {formatRelativeTime(location.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="p-5 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="rounded-xl hover:bg-primary hover:text-primary-foreground transition-all text-muted-foreground"
                          >
                            <Link href={`/assets/locations/${location.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
