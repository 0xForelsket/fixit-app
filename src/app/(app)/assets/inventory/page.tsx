import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLayout } from "@/components/ui/page-layout";
import { db } from "@/db";
import { spareParts } from "@/db/schema";
import { cn } from "@/lib/utils";
import { desc, eq } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  ChevronRight,
  Package,
  Plus,
  TrendingDown,
  Upload,
} from "lucide-react";
import Link from "next/link";

async function getStats() {
  const allParts = await db.query.spareParts.findMany({
    where: eq(spareParts.isActive, true),
  });

  const levels = await db.query.inventoryLevels.findMany({
    with: {
      part: true,
      location: true,
    },
  });

  // Calculate low stock items
  const lowStockItems = levels.filter((level) => {
    if (!level.part) return false;
    return level.quantity <= level.part.reorderPoint;
  });

  // Total value
  const totalValue = levels.reduce((sum, level) => {
    if (!level.part?.unitCost) return sum;
    return sum + level.quantity * level.part.unitCost;
  }, 0);

  return {
    totalParts: allParts.length,
    lowStockCount: lowStockItems.length,
    lowStockItems,
    totalValue,
  };
}

async function getRecentParts() {
  return db.query.spareParts.findMany({
    where: eq(spareParts.isActive, true),
    orderBy: [desc(spareParts.createdAt)],
    limit: 5,
  });
}

export default async function InventoryPage() {
  const stats = await getStats();
  const recentParts = await getRecentParts();

  return (
    <PageLayout
      id="inventory-page"
      title={
        <span className="flex flex-col items-start gap-1">
          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 after:h-px after:w-8 after:bg-foreground/20 leading-none">
            Stock Management
          </span>
          <span className="text-4xl lg:text-5xl font-black tracking-tight text-foreground">
            Inventory Control
          </span>
        </span>
      }
      description={
        <div className="flex items-center gap-4 mt-2">
          <div className="flex h-px w-12 bg-border" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            {stats.totalParts} UNIQUE SKUS | STOCK VALUE: $
            {stats.totalValue.toLocaleString()}
          </span>
        </div>
      }
      bgSymbol="IV"
      headerActions={
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            asChild
            className="rounded-full border-2 border-zinc-200 h-11 px-6 font-black text-[10px] uppercase tracking-wider hover:bg-zinc-50 transition-all"
          >
            <Link href="/assets/inventory/import">
              <Upload className="mr-2 h-4 w-4" />
              IMPORT DATA
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="rounded-full border-2 border-zinc-200 h-11 px-6 font-black text-[10px] uppercase tracking-wider hover:bg-zinc-50 transition-all"
          >
            <Link href="/assets/inventory/parts">
              <Package className="mr-2 h-4 w-4 text-zinc-400 group-hover:text-foreground" />
              CATALOG
            </Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-zinc-950 text-white h-11 px-8 font-black text-[10px] uppercase tracking-wider shadow-lg shadow-zinc-950/20 hover:bg-zinc-900 active:scale-95 transition-all"
          >
            <Link href="/assets/inventory/parts/new">
              <Plus className="mr-2 h-4 w-4" />
              ADD NEW PART
            </Link>
          </Button>
        </div>
      }
      stats={
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mt-8">
          <StatCard
            label="TOTAL PARTS"
            value={stats.totalParts}
            variant="zinc"
            icon={Box}
          />
          <StatCard
            label="LOW STOCK WARNING"
            value={stats.lowStockCount}
            variant="danger"
            icon={AlertTriangle}
          />
          <StatCard
            label="INVENTORY ASSETS"
            value={`$${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
            variant="success"
            icon={TrendingDown}
          />
        </div>
      }
    >
      {/* Low Stock Alerts */}
      {stats.lowStockCount > 0 && (
        <div className="rounded-3xl border border-red-100 bg-red-50/50 p-8 shadow-xl shadow-red-500/5 backdrop-blur-sm overflow-hidden relative mb-8 group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12 pointer-events-none">
            <AlertTriangle className="h-64 w-64" />
          </div>

          <div className="relative z-10 mb-8 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 animate-pulse">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-red-950 tracking-tight uppercase leading-none">
                Critical Supply Shortage
              </h3>
              <p className="text-red-700/60 font-bold text-[10px] mt-1.5 uppercase tracking-[0.1em]">
                REORDER REQUIRED FOR THE FOLLOWING ASSETS
              </p>
            </div>
          </div>

          <div className="relative z-10 grid gap-4">
            {stats.lowStockItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="group/item flex flex-col md:flex-row md:items-center justify-between rounded-2xl border border-red-100/50 bg-white/80 p-5 transition-all hover:bg-white hover:shadow-lg hover:shadow-red-500/5 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white font-mono text-[10px] font-black shadow-lg group-hover/item:scale-110 transition-transform">
                    {item.part?.sku?.slice(0, 6) || "PART"}
                  </div>
                  <div>
                    <p className="font-black text-zinc-950 text-base tracking-tight">
                      {item.part?.name}
                    </p>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] mt-1">
                      LOC: {item.location?.name} | SKU: {item.part?.sku}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-8 mt-5 md:mt-0">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1.5">
                      AVAILABLE / REORDER
                    </p>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-red-600 text-xl leading-none">
                        {item.quantity}
                      </span>
                      <span className="text-zinc-200 text-xl leading-none font-light">
                        /
                      </span>
                      <span className="font-mono font-black text-zinc-950 text-xl leading-none">
                        {item.part?.reorderPoint}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 rounded-lg bg-red-100/50 border border-red-200">
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                      CRITICAL
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {stats.lowStockCount > 5 && (
            <Link
              href="/assets/inventory/parts?filter=low-stock"
              className="relative z-10 mt-8 flex items-center justify-center gap-2 text-[10px] font-black text-red-950 hover:text-red-600 tracking-[0.2em] uppercase transition-all py-4 border-t border-red-100/50"
            >
              Scan all {stats.lowStockCount} identified outages
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3 mb-12">
        <QuickAction
          href="/assets/inventory/receive"
          title="RECEIVE STOCK"
          description="Process incoming supplier deliveries"
          icon={Package}
          color="bg-emerald-50 text-emerald-600 border-emerald-100"
          accent="bg-emerald-500"
        />
        <QuickAction
          href="/assets/inventory/transactions"
          title="LOG HISTORY"
          description="Audit complete movement logs"
          icon={TrendingDown}
          color="bg-zinc-50 text-zinc-600 border-zinc-100"
          accent="bg-zinc-950"
        />
        <QuickAction
          href="/assets/inventory/parts"
          title="PART CATALOG"
          description="Maintain master part definitions"
          icon={Box}
          color="bg-zinc-50 text-zinc-600 border-zinc-100"
          accent="bg-zinc-950"
        />
      </div>

      {/* Recent Parts */}
      <div className="rounded-3xl border border-zinc-100 bg-white p-8 shadow-xl shadow-zinc-200/20">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-2 w-8 bg-foreground rounded-full" />
            <h3 className="text-xl font-black tracking-tight text-zinc-950 uppercase">
              Latest Registrations
            </h3>
          </div>
          <Link
            href="/assets/inventory/parts"
            className="text-[10px] font-black text-zinc-400 hover:text-zinc-950 uppercase tracking-[0.2em] transition-all flex items-center gap-1.5 group"
          >
            VIEW FULL CATALOG
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        {recentParts.length === 0 ? (
          <EmptyState
            title="Catalog synchronization required"
            description="No new modules detected in database. Register your first SKU to begin tracking assets."
            icon={Package}
            className="py-16 bg-transparent border-none"
          />
        ) : (
          <div className="grid gap-4">
            {recentParts.map((part, index) => {
              const staggerClass =
                index < 5
                  ? `animate-stagger-${index + 1}`
                  : "animate-in fade-in duration-500";
              return (
                <Link
                  key={part.id}
                  href={`/assets/inventory/parts/${part.id}`}
                  className={cn(
                    "group flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-zinc-50 p-5 transition-all hover:border-zinc-200 hover:bg-zinc-50/50 hover-lift animate-in fade-in slide-in-from-bottom-1",
                    staggerClass
                  )}
                >
                  <div className="flex items-center gap-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-xl group-hover:scale-105 transition-transform">
                      <Box className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="font-black text-zinc-950 text-base tracking-tight group-hover:text-foreground transition-colors uppercase">
                        {part.name}
                      </p>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] mt-1.5">
                        SKU: {part.sku} • CAT:{" "}
                        {part.category?.toUpperCase() || "UNASSIGNED"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 mt-5 sm:mt-0">
                    <div className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-300 group-hover:bg-zinc-950 group-hover:text-white group-hover:border-zinc-950 transition-all">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

function StatCard({
  label,
  value,
  variant,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  variant: "zinc" | "danger" | "success";
  icon: React.ElementType;
}) {
  const variants = {
    zinc: "bg-zinc-100 border-zinc-200 text-zinc-950",
    danger: "bg-red-50 border-red-100 text-red-600",
    success: "bg-emerald-50 border-emerald-100 text-emerald-600",
  };

  const dotVariants = {
    zinc: "bg-zinc-400",
    danger: "bg-red-500",
    success: "bg-emerald-500",
  };

  const bgVariants = {
    zinc: "bg-zinc-200/50",
    danger: "bg-red-100/50",
    success: "bg-emerald-100/50",
  };

  return (
    <div
      className={cn(
        "rounded-3xl border p-8 relative overflow-hidden group hover-lift transition-all",
        variants[variant]
      )}
    >
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-60">
            {label}
          </span>
          <div
            className={cn(
              "h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6",
              bgVariants[variant]
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black tracking-tighter leading-none">
            {value}
          </span>
          <div
            className={cn(
              "h-2 w-2 rounded-full animate-pulse",
              dotVariants[variant]
            )}
          />
        </div>
      </div>

      {/* Decorative gradient */}
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-current opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon: Icon,
  color,
  accent,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-6 rounded-3xl border border-zinc-100 bg-white p-6 transition-all duration-300 hover:border-zinc-200 hover:shadow-2xl hover:shadow-zinc-200/40 hover-lift"
    >
      <div
        className={cn(
          "absolute top-0 right-0 w-1.5 h-full rounded-r-3xl transition-all group-hover:w-3",
          accent
        )}
      />
      <div
        className={cn(
          "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border transition-all group-hover:scale-110 group-hover:rotate-3 shadow-inner",
          color
        )}
      >
        <Icon className="h-8 w-8" />
      </div>
      <div>
        <p className="font-black text-zinc-950 uppercase tracking-tight group-hover:text-foreground transition-colors">
          {title}
        </p>
        <p className="text-[11px] font-medium text-zinc-400 mt-1 lines-2 leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}
