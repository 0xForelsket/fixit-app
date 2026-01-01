"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Location } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

interface EquipmentSearchProps {
  locations: Location[];
  initialSearch: string;
}

export function EquipmentSearch({
  locations,
  initialSearch,
}: EquipmentSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
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
    <div className="space-y-3">
      {/* Search Bar - Industrial */}
      <div className="relative group">
        <Input
          type="search"
          placeholder="Scan or type equipment..."
          value={search}
          onChange={(e) => updateSearch(e.target.value)}
          className="pl-10 h-10 border-border focus-visible:ring-primary rounded-lg bg-muted/50 group-focus-within:bg-background group-focus-within:shadow-sm transition-all"
        />
        <Search
          className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
          aria-hidden="true"
        />
        {search && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Location Filter Chips - Scrollable */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <Button
          variant={currentLocation === "" ? "default" : "outline"}
          size="sm"
          onClick={() => handleLocationClick("")}
          className={cn(
            "h-7 px-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 rounded-full transition-all",
            currentLocation === ""
              ? "bg-primary border-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground border-border bg-card hover:bg-muted hover:text-foreground"
          )}
        >
          All
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
              "h-7 px-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 rounded-full transition-all",
              currentLocation === location.id.toString()
                ? "bg-primary border-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground border-border bg-card hover:bg-muted hover:text-foreground"
            )}
          >
            {location.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
