import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLayout } from "@/components/ui/page-layout";
import { StatsTicker } from "@/components/ui/stats-ticker";
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
      title="Inventory Control"
      subtitle="Stock Management"
      description={`${stats.totalParts} UNIQUE SKUS | STOCK VALUE: $${stats.totalValue.toLocaleString()}`}
      bgSymbol="IV"
      headerActions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            asChild
            className="rounded-full border-2 font-black text-[10px] uppercase tracking-wider h-11 px-6 hover:bg-muted transition-all"
          >
            <Link href="/assets/inventory/import">
              <Upload className="mr-2 h-4 w-4" />
              IMPORT DATA
            </Link>
          </Button>
          <Button
            variant="ghost"
            asChild
            className="rounded-full font-black text-[10px] uppercase tracking-wider h-11 px-6 hover:bg-muted transition-all"
          >
            <Link href="/assets/inventory/parts">
              <Package className="mr-2 h-4 w-4" />
              CATALOG
            </Link>
          </Button>
          <Button
            asChild
            className="rounded-full font-black text-[10px] uppercase tracking-wider h-11 px-8 shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
          >
            <Link href="/assets/inventory/parts/new">
              <Plus className="mr-2 h-4 w-4" />
              ADD NEW PART
            </Link>
          </Button>
        </div>
      }
      stats={
        <StatsTicker
          stats={[
            {
              label: "Total Parts",
              value: stats.totalParts,
              icon: Box,
              variant: "default",
            },
            {
              label: "Low Stock Warning",
              value: stats.lowStockCount,
              icon: AlertTriangle,
              variant: stats.lowStockCount > 0 ? "danger" : "default",
            },
            {
              label: "Inventory Assets",
              value: `$${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}`,
              icon: TrendingDown,
              variant: "success",
            },
          ]}
        />
      }
    >
      {/* Low Stock Alerts */}
      {stats.lowStockCount > 0 && (
        <div className="rounded-2xl border-2 border-danger-200 bg-danger-50 p-6 shadow-lg shadow-danger-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <AlertTriangle className="h-24 w-24" />
          </div>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-danger-500 text-white flex items-center justify-center animate-pulse">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-danger-900 tracking-tight uppercase leading-none">
                Critical Supply Shortage
              </h3>
              <p className="text-danger-700/80 font-medium text-xs mt-1 lowercase">
                REORDER REQUIRED FOR THE FOLLOWING ASSETS
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {stats.lowStockItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-danger-100 bg-white p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white font-mono text-xs font-black">
                    #{item.id}
                  </div>
                  <div>
                    <p className="font-black text-zinc-900">
                      {item.part?.name}
                    </p>
                    <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                      LOC: {item.location?.name} | SKU: {item.part?.sku}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 mt-4 sm:mt-0">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                      AVAILABLE / REORDER
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-danger-600 text-lg">
                        {item.quantity}
                      </span>
                      <span className="text-zinc-300">/</span>
                      <span className="font-mono font-bold text-zinc-500">
                        {item.part?.reorderPoint}
                      </span>
                    </div>
                  </div>
                  <Badge variant="danger" className="font-black px-3 py-1">
                    CRITICAL
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {stats.lowStockCount > 5 && (
            <Link
              href="/assets/inventory/parts?filter=low-stock"
              className="mt-6 flex items-center justify-center gap-1.5 text-xs font-black text-danger-700 uppercase tracking-widest hover:text-danger-800 transition-colors py-2 border-t border-danger-100"
            >
              Scan all {stats.lowStockCount} identified outages
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <QuickAction
          href="/assets/inventory/receive"
          title="RECEIVE STOCK"
          description="Process incoming supplier deliveries"
          icon={Package}
          color="bg-success-100 text-success-600 border-success-200"
          accent="bg-success-500"
        />
        <QuickAction
          href="/assets/inventory/transactions"
          title="LOG HISTORY"
          description="Audit complete movement logs"
          icon={TrendingDown}
          color="bg-primary-100 text-primary-600 border-primary-200"
          accent="bg-primary-500"
        />
        <QuickAction
          href="/assets/inventory/parts"
          title="PART CATALOG"
          description="Maintain master part definitions"
          icon={Box}
          color="bg-secondary-100 text-secondary-600 border-secondary-200"
          accent="bg-secondary-500"
        />
      </div>

      {/* Recent Parts */}
      <div className="rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-sm p-6 shadow-xl shadow-zinc-200/10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-8 bg-primary-500 rounded-full" />
            <h3 className="text-lg font-black tracking-tight text-zinc-900 uppercase">
              Latest Registrations
            </h3>
          </div>
          <Link
            href="/assets/inventory/parts"
            className="text-[10px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest transition-colors flex items-center gap-1.5"
          >
            VIEW FULL CATALOG <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recentParts.length === 0 ? (
          <EmptyState
            title="Catalog synchronization required"
            description="No new modules detected in database. Register your first SKU to begin tracking assets."
            icon={Package}
            className="py-12 bg-transparent border-none"
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
                    "group flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-zinc-100 p-4 transition-all hover:border-primary-400 hover:bg-primary-50/20 hover-lift animate-in fade-in slide-in-from-bottom-1",
                    staggerClass
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg group-hover:scale-110 transition-transform">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-black text-zinc-900 group-hover:text-primary-700 transition-colors uppercase tracking-tight">
                        {part.name}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-1">
                        SKU: {part.sku} • CAT: {part.category?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 mt-4 sm:mt-0">
                    <div className="h-8 w-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-500 transition-all">
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
      className="group relative flex items-center gap-5 rounded-2xl border border-zinc-200 bg-white p-5 transition-all duration-300 hover:border-primary-400 hover:shadow-xl hover:shadow-primary-500/5 hover-lift"
    >
      <div
        className={cn(
          "absolute top-0 right-0 w-1 h-full rounded-r-2xl transition-all group-hover:w-2",
          accent
        )}
      />
      <div
        className={cn(
          "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border shadow-inner transition-transform group-hover:scale-110",
          color
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="font-black text-zinc-900 uppercase tracking-tight group-hover:text-primary-600 transition-colors">
          {title}
        </p>
        <p className="text-xs font-medium text-zinc-500 mt-0.5 leading-snug">
          {description}
        </p>
      </div>
    </Link>
  );
}
