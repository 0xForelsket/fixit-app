"use client";

import { ArrowRight, Clock, MonitorCog } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SimpleEquipment {
  id: string;
  name: string;
  code: string;
  locationName?: string;
}

const RECENT_KEY = "fixit_recent_equipment";

export function RecentEquipment() {
  const [recent, setRecent] = useState<SimpleEquipment[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_KEY);
    if (stored) {
      try {
        setRecent(JSON.parse(stored).slice(0, 4));
      } catch (e) {
        console.error("Failed to parse recent equipment", e);
      }
    }

    // Listen for custom event to refresh
    const handleRefresh = () => {
      const updated = localStorage.getItem(RECENT_KEY);
      if (updated) setRecent(JSON.parse(updated).slice(0, 4));
    };

    window.addEventListener("recent-equipment-updated", handleRefresh);
    return () =>
      window.removeEventListener("recent-equipment-updated", handleRefresh);
  }, []);

  if (recent.length === 0) return null;

  return (
    <section className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest">
          Recent Assets
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {recent.map((item) => (
          <Link
            key={item.id}
            href={`/equipment/${item.code}`}
            className="group flex flex-col gap-1.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-all hover:border-primary-300 hover:shadow-md active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-100 group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors">
                <MonitorCog className="h-4 w-4 text-zinc-400 group-hover:text-primary-600" />
              </div>
              <ArrowRight className="h-3 w-3 text-zinc-300 group-hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-all" />
            </div>

            <div className="min-w-0">
              <p className="font-bold text-xs text-zinc-900 truncate">
                {item.name}
              </p>
              <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-tighter truncate">
                {item.code}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * Utility to save equipment to recent list
 */
export function saveToRecent(equipment: SimpleEquipment) {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(RECENT_KEY);
  let recent: SimpleEquipment[] = stored ? JSON.parse(stored) : [];

  // Remove existing
  recent = recent.filter((e) => e.id !== equipment.id);

  // Add to start
  recent.unshift(equipment);

  // Limit to 10
  recent = recent.slice(0, 10);

  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  window.dispatchEvent(new CustomEvent("recent-equipment-updated"));
}
