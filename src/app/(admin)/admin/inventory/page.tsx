import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage spare parts and stock levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/inventory/parts">
              <Package className="mr-2 h-4 w-4" />
              Parts Catalog
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/inventory/parts/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Part
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Parts"
          value={stats.totalParts}
          icon={Box}
          color="text-primary-600"
          bg="bg-primary-50"
        />
        <StatCard
          title="Low Stock Alert"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          color={stats.lowStockCount > 0 ? "text-rose-600" : "text-slate-400"}
          bg={stats.lowStockCount > 0 ? "bg-rose-50" : "bg-slate-50"}
        />
        <StatCard
          title="Total Value"
          value={`$${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={TrendingDown}
          color="text-emerald-600"
          bg="bg-emerald-50"
          isText
        />
      </div>

      {/* Low Stock Alerts */}
      {stats.lowStockCount > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <h3 className="font-semibold text-rose-800">Low Stock Alerts</h3>
          </div>
          <div className="space-y-2">
            {stats.lowStockItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-white p-3"
              >
                <div>
                  <p className="font-medium">{item.part?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.location?.name} • SKU: {item.part?.sku}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="destructive">
                    {item.quantity} / {item.part?.reorderPoint}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    qty / reorder point
                  </p>
                </div>
              </div>
            ))}
            {stats.lowStockCount > 5 && (
              <Link
                href="/admin/inventory/parts?filter=low-stock"
                className="flex items-center gap-1 text-sm font-medium text-rose-700 hover:text-rose-800"
              >
                View all {stats.lowStockCount} items
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickAction
          href="/admin/inventory/receive"
          title="Receive Stock"
          description="Add new inventory from suppliers"
          icon={Package}
          color="bg-emerald-50 text-emerald-600"
        />
        <QuickAction
          href="/admin/inventory/transactions"
          title="Transaction History"
          description="View all stock movements"
          icon={TrendingDown}
          color="bg-primary-50 text-primary-600"
        />
        <QuickAction
          href="/admin/inventory/parts"
          title="Parts Catalog"
          description="Manage spare parts inventory"
          icon={Box}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Recent Parts */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Recently Added Parts</h3>
          <Link
            href="/admin/inventory/parts"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View All →
          </Link>
        </div>
        {recentParts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No parts added yet</p>
        ) : (
          <div className="space-y-2">
            {recentParts.map((part) => (
              <Link
                key={part.id}
                href={`/admin/inventory/parts/${part.id}`}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <Package className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium">{part.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {part.sku} • {part.category}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
  isText,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  isText?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white p-4">
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
        <p
          className={cn(
            isText ? "text-lg font-bold" : "text-2xl font-bold",
            color
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon: Icon,
  color,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border bg-white p-4 transition-colors hover:bg-slate-50"
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg",
          color
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
