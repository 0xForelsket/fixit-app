import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";

interface SortHeaderProps {
  label: string;
  field: string;
  currentSort?: string;
  currentDir?: string;
  className?: string;
  params: Record<string, string | undefined>;
}

export function SortHeader({
  label,
  field,
  currentSort,
  currentDir,
  className,
  params,
}: SortHeaderProps) {
  const isActive = currentSort === field;
  // If active and 'asc', toggle to 'desc'. Otherwise (inactive or 'desc'), go to 'asc'
  // Actually standard behavior is: click inactive -> asc. click active asc -> desc. click active desc -> asc.
  const nextDir = isActive && currentDir === "asc" ? "desc" : "asc";

  const query = new URLSearchParams();

  // Preserve all existing params
  for (const [key, value] of Object.entries(params)) {
    // Exclude pagination when sorting changes so we reset to page 1
    if (value && key !== "sort" && key !== "dir" && key !== "page") {
      query.set(key, value);
    }
  }

  // Set new sort params
  query.set("sort", field);
  query.set("dir", nextDir);

  return (
    <TableHead
      className={cn(
        "p-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 cursor-pointer hover:bg-zinc-100 hover:text-zinc-600 transition-colors select-none group",
        className
      )}
    >
      <Link href={`?${query.toString()}`} className="flex items-center gap-2">
        {label}
        {isActive ? (
          currentDir === "asc" ? (
            <ArrowUp className="h-3 w-3 text-primary-500" />
          ) : (
            <ArrowDown className="h-3 w-3 text-primary-500" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </Link>
    </TableHead>
  );
}
