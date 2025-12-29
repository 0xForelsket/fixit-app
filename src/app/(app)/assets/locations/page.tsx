import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SortHeader } from "@/components/ui/sort-header";
import { StatsCard } from "@/components/ui/stats-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { LocationTree } from "./location-tree";
import { ViewToggle } from "@/components/ui/view-toggle";

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
    <div className="space-y-6">
      {/* Header */}
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase font-serif-brand">
            Facility <span className="text-primary">Locations</span>
          </h1>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            <MapPin className="h-3.5 w-3.5" />
            {stats.total} ZONES • {stats.roots} ROOT AREAS
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle />
          <div className="w-px h-8 bg-border mx-2 hidden lg:block" />
          <Button asChild>
            <Link href="/assets/locations/new">
              <Plus className="mr-2 h-4 w-4" />
              ADD LOCATION
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Locations"
          value={stats.total}
          icon={MapPin}
          variant="primary"
          className="animate-stagger-1 animate-in"
        />
        <StatsCard
          title="Root Areas"
          value={stats.roots}
          icon={Building}
          variant="secondary"
          className="animate-stagger-2 animate-in"
        />
        <StatsCard
          title="Active"
          value={stats.active}
          icon={FolderTree}
          variant="success"
          className="animate-stagger-3 animate-in"
        />
      </div>

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
              placeholder="Search by name or code..."
              defaultValue={params.search}
              className="w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </form>
      </div>

      {params.view === "tree" ? (
        <div className="rounded-2xl border border-zinc-200 bg-white/50 backdrop-blur-sm shadow-xl shadow-zinc-200/20 overflow-hidden">
          <Suspense fallback={<div className="h-96 animate-pulse bg-white rounded-2xl" />}>
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
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b text-left text-sm font-medium text-muted-foreground hover:bg-transparent">
                <SortHeader
                  label="Location"
                  field="name"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-4"
                />
                <SortHeader
                  label="Code"
                  field="code"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-4 hidden md:table-cell"
                />
                <SortHeader
                  label="Parent"
                  field="parent"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-4 hidden lg:table-cell"
                />
                <SortHeader
                  label="Status"
                  field="status"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-4"
                />
                <SortHeader
                  label="Created"
                  field="createdAt"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-4 hidden sm:table-cell"
                />
                <TableHead className="p-4" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {locationsList.map((location, index) => {
                const staggerClass =
                  index < 5
                    ? `animate-stagger-${index + 1}`
                    : "animate-in fade-in duration-500";
                return (
                  <TableRow
                    key={location.id}
                    className={cn(
                      "hover:bg-slate-50 transition-colors animate-in fade-in slide-in-from-bottom-1",
                      staggerClass
                    )}
                  >
                    <TableCell className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                          <MapPin className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium">{location.name}</p>
                          {location.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {location.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-4 hidden md:table-cell">
                      <Badge variant="outline" className="font-mono text-xs">
                        {location.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4 hidden lg:table-cell">
                      {location.parent ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <ChevronRight className="h-3.5 w-3.5" />
                          {location.parent.name}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Root
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="p-4">
                      {location.isActive ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="p-4 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {formatRelativeTime(location.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="p-4">
                      <Button variant="ghost" size="sm" asChild>
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
    </div>
  );
}
