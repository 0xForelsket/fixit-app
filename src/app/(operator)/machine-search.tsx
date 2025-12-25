"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Location } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

interface MachineSearchProps {
  locations: Location[];
  initialSearch: string;
}

export function MachineSearch({
  locations,
  initialSearch,
}: MachineSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);

  // Get current location from URL or default to empty (All)
  const currentLocation = searchParams.get("location") || "";

  const updateSearch = useCallback(
    (value: string) => {
      setSearch(value);

      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
          params.set("search", value);
        } else {
          params.delete("search");
        }
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const clearSearch = () => {
    updateSearch("");
  };

  const handleLocationClick = (locationId: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (locationId) {
        params.set("location", locationId);
      } else {
        params.delete("location");
      }
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar - Large & High Vis */}
      <div className="relative">
        <Input
          type="search"
          placeholder="Scan or type machine name/code..."
          value={search}
          onChange={(e) => updateSearch(e.target.value)}
          className="pl-12 h-14 text-lg shadow-sm border-muted-foreground/30 focus-visible:ring-primary-500 transition-all rounded-xl"
        />
        <Search
          className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        {search && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-12 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Clear search</span>
          </button>
        )}
        {isPending && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-primary-600 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Location Filter Chips - Scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        <Button
          variant={currentLocation === "" ? "default" : "outline"}
          size="sm"
          onClick={() => handleLocationClick("")}
          className={cn(
            "rounded-full whitespace-nowrap h-9 px-4 font-medium transition-all",
            currentLocation === ""
              ? "shadow-md scale-105"
              : "text-muted-foreground bg-background hover:text-foreground hover:bg-muted hover:border-muted-foreground/50"
          )}
        >
          All Locations
        </Button>
        {locations.map((location) => (
          <Button
            key={location.id}
            variant={
              currentLocation === location.id.toString() ? "default" : "outline"
            }
            size="sm"
            onClick={() => handleLocationClick(location.id.toString())}
            className={cn(
              "rounded-full whitespace-nowrap h-9 px-4 font-medium transition-all",
              currentLocation === location.id.toString()
                ? "shadow-md scale-105"
                : "text-muted-foreground bg-background hover:text-foreground hover:bg-muted hover:border-muted-foreground/50"
            )}
          >
            {location.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
