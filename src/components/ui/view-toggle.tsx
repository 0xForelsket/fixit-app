"use client";

import { cn } from "@/lib/utils";
import { Layers, LayoutList } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function ViewToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "list";

  const setView = (view: "list" | "tree") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200 shadow-inner">
      <button
        type="button"
        onClick={() => setView("list")}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
          currentView === "list"
            ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
            : "text-zinc-500 hover:text-zinc-700"
        )}
      >
        <LayoutList className="h-3 w-3" />
        LIST
      </button>
      <button
        type="button"
        onClick={() => setView("tree")}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
          currentView === "tree"
            ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
            : "text-zinc-500 hover:text-zinc-700"
        )}
      >
        <Layers className="h-3 w-3" />
        HIERARCHY
      </button>
    </div>
  );
}
