"use client";

import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

interface EquipmentFiltersProps {
  searchParams: {
    status?: string;
    location?: string;
    search?: string;
  };
}

export function EquipmentFilters({ searchParams }: EquipmentFiltersProps) {
  const router = useRouter();

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (searchParams.status && searchParams.status !== "all")
      params.set("status", searchParams.status);
    if (searchParams.location && searchParams.location !== "all")
      params.set("location", searchParams.location);

    const queryString = params.toString();
    router.push(`/assets/equipment${queryString ? `?${queryString}` : ""}`);
  };

  const hasActiveFilters = !!(
    (searchParams.status && searchParams.status !== "all") ||
    searchParams.search
  );
  return (
    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-muted/40 p-4 rounded-xl border border-border/60 backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] ring-1 ring-black/5">
      <form className="flex-1 relative group" onSubmit={handleSearchSubmit}>
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-transform duration-200 group-focus-within:scale-110">
          <Search className="h-3.5 w-3.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          name="search"
          placeholder="SEARCH BY NAME OR SERIAL..."
          defaultValue={searchParams.search}
          className="w-full h-10 rounded-lg border-2 border-border/50 bg-card/80 pl-11 pr-4 text-[11px] font-bold uppercase tracking-[0.05em] transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
        />
        {searchParams.search && (
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.delete("search");
              router.push(`/assets/equipment?${params.toString()}`);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground/50 hover:text-danger transition-all active:scale-90"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          name="status"
          value={searchParams.status || "all"}
          options={[
            { value: "all", label: "ANY STATUS" },
            { value: "operational", label: "OPERATIONAL" },
            { value: "down", label: "DOWN" },
            { value: "maintenance", label: "MAINTENANCE" },
          ]}
          basePath="/assets/equipment"
          searchParams={searchParams}
        />

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-4 rounded-lg bg-background/50 border-2 border-border/40 hover:border-danger hover:bg-danger/5 hover:text-danger text-[10px] font-black uppercase tracking-[0.1em] transition-all active:scale-95 group shadow-sm"
            asChild
          >
            <Link href="/assets/equipment">
              <X className="mr-2 h-3.5 w-3.5 transition-transform group-hover:rotate-90 duration-200" />
              RESET ALL
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
