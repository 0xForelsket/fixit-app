"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Command } from "cmdk";
import {
  FileText,
  LayoutDashboard,
  Loader2,
  Package,
  Search,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface SearchResult {
  id: string;
  type: "work_order" | "equipment" | "part" | "page";
  title: string;
  subtitle?: string;
  href: string;
}

const typeIcons: Record<SearchResult["type"], React.ElementType> = {
  work_order: FileText,
  equipment: Wrench,
  part: Package,
  page: LayoutDashboard,
};

const typeLabels: Record<SearchResult["type"], string> = {
  work_order: "Work Orders",
  equipment: "Equipment",
  part: "Parts",
  page: "Pages",
};

interface GlobalSearchProps {
  showTrigger?: boolean;
}

export function GlobalSearch({ showTrigger = false }: GlobalSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Handle keyboard shortcut and custom event
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    const handleToggle = () => {
      setOpen((open) => !open);
    };

    document.addEventListener("keydown", down);
    document.addEventListener("toggle-command-menu", handleToggle);

    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("toggle-command-menu", handleToggle);
    };
  }, []);

  // Search API
  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/search/global?q=${encodeURIComponent(searchQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  // Group results by type
  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    },
    {} as Record<SearchResult["type"], SearchResult[]>
  );

  return (
    <>
      {/* Search Trigger Button - only show if requested */}
      {showTrigger && (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="relative h-9 w-full justify-start gap-2 text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        >
          <Search className="h-4 w-4" />
          <span className="hidden lg:inline-flex">Search...</span>
          <span className="inline-flex lg:hidden">Search</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      )}

      {/* Command Dialog */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close search"
          />

          {/* Dialog */}
          <div className="fixed left-1/2 top-1/4 z-50 w-full max-w-lg -translate-x-1/2 p-4">
            <Command
              className="overflow-hidden rounded-xl border bg-popover shadow-2xl"
              shouldFilter={false}
            >
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search work orders, equipment, parts..."
                  className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  autoFocus
                />
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                )}
              </div>

              <Command.List className="max-h-[300px] overflow-y-auto p-2">
                {query.length < 2 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Type at least 2 characters to search...
                  </div>
                ) : results.length === 0 && !loading ? (
                  <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                    No results found.
                  </Command.Empty>
                ) : (
                  Object.entries(groupedResults).map(([type, items]) => {
                    const Icon = typeIcons[type as SearchResult["type"]];
                    return (
                      <Command.Group
                        key={type}
                        heading={
                          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <Icon className="h-3 w-3" />
                            {typeLabels[type as SearchResult["type"]]}
                          </span>
                        }
                        className="mb-2"
                      >
                        {items.map((result) => {
                          const ResultIcon = typeIcons[result.type];
                          return (
                            <Command.Item
                              key={result.id}
                              value={result.id}
                              onSelect={() => handleSelect(result.href)}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm",
                                "hover:bg-accent aria-selected:bg-accent"
                              )}
                            >
                              <ResultIcon className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 overflow-hidden">
                                <p className="truncate font-medium">
                                  {result.title}
                                </p>
                                {result.subtitle && (
                                  <p className="truncate text-xs text-muted-foreground">
                                    {result.subtitle}
                                  </p>
                                )}
                              </div>
                            </Command.Item>
                          );
                        })}
                      </Command.Group>
                    );
                  })
                )}
              </Command.List>

              <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <kbd className="rounded border bg-muted px-1.5 py-0.5">
                    ↑↓
                  </kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="rounded border bg-muted px-1.5 py-0.5">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="rounded border bg-muted px-1.5 py-0.5">
                    esc
                  </kbd>
                  <span>Close</span>
                </div>
              </div>
            </Command>
          </div>
        </>
      )}
    </>
  );
}
