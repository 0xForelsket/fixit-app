import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type SearchParams = {
  search?: string;
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
      <div className="flex items-center justify-between border-b border-zinc-200 pb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 uppercase">
            Facility <span className="text-primary-600">Locations</span>
          </h1>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
            <MapPin className="h-3.5 w-3.5" />
            {stats.total} ZONES • {stats.roots} ROOT AREAS
          </div>
        </div>
        <Button asChild className="font-bold shadow-lg shadow-primary-500/20">
          <Link href="/admin/locations/new">
            <Plus className="mr-2 h-4 w-4" />
            ADD LOCATION
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Locations"
          value={stats.total}
          icon={MapPin}
          color="text-primary-600"
          bg="bg-primary-50"
        />
        <StatsCard
          title="Root Areas"
          value={stats.roots}
          icon={Building}
          color="text-slate-600"
          bg="bg-slate-50"
        />
        <StatsCard
          title="Active"
          value={stats.active}
          icon={FolderTree}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <form
          className="flex-1 max-w-md"
          action="/admin/locations"
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

      {/* Locations Table */}
      {locationsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MapPin className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No locations found</h3>
          <p className="text-sm text-muted-foreground">
            {params.search
              ? "Try adjusting your search"
              : "Add your first location to get started."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b bg-slate-50">
              <tr className="text-left text-sm font-medium text-muted-foreground">
                <th className="p-4">Location</th>
                <th className="p-4 hidden md:table-cell">Code</th>
                <th className="p-4 hidden lg:table-cell">Parent</th>
                <th className="p-4">Status</th>
                <th className="p-4 hidden sm:table-cell">Created</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {locationsList.map((location) => (
                <tr
                  key={location.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-4">
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
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <Badge variant="outline" className="font-mono text-xs">
                      {location.code}
                    </Badge>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
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
                  </td>
                  <td className="p-4">
                    {location.isActive ? (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {formatRelativeTime(location.createdAt)}
                    </span>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/locations/${location.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
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

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-4 bg-white">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          bg
        )}
      >
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn("text-2xl font-bold", color)}>{value}</p>
      </div>
    </div>
  );
}
