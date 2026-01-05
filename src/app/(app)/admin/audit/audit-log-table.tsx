"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { AuditLog, EntityType, User } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

interface AuditLogWithUser extends AuditLog {
  user: Pick<User, "id" | "name" | "employeeId"> | null;
}

interface AuditLogTableProps {
  logs: AuditLogWithUser[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  params: {
    action?: string;
    entityType?: string;
    userId?: string;
    search?: string;
    from?: string;
    to?: string;
  };
  users: { id: string; name: string; employeeId: string }[];
  actions: string[];
  entityTypes: EntityType[];
}

const actionIcons: Record<string, React.ReactNode> = {
  CREATE: <Plus className="h-3 w-3" />,
  UPDATE: <Pencil className="h-3 w-3" />,
  DELETE: <Trash2 className="h-3 w-3" />,
  LOGIN: <LogIn className="h-3 w-3" />,
  LOGOUT: <LogOut className="h-3 w-3" />,
};

const actionColors: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  UPDATE: "bg-blue-100 text-blue-700 border-blue-200",
  DELETE: "bg-rose-100 text-rose-700 border-rose-200",
  LOGIN: "bg-violet-100 text-violet-700 border-violet-200",
  LOGOUT: "bg-slate-100 text-slate-700 border-slate-200",
};

const entityLabels: Record<EntityType, string> = {
  user: "User",
  equipment: "Equipment",
  work_order: "Work Order",
  location: "Location",
  vendor: "Vendor",
  spare_part: "Spare Part",
};

const entityLinks: Record<EntityType, string> = {
  user: "/admin/users",
  equipment: "/assets/equipment",
  work_order: "/maintenance/work-orders",
  location: "/assets/locations",
  vendor: "/assets/vendors",
  spare_part: "/assets/inventory/parts",
};

export function AuditLogTable({
  logs,
  pagination,
  params,
  users,
  actions,
  entityTypes,
}: AuditLogTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(
    !!(
      params.action ||
      params.entityType ||
      params.userId ||
      params.from ||
      params.to
    )
  );
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== "all") {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      }

      // Reset to page 1 when filters change
      if (!("page" in updates)) {
        newParams.delete("page");
      }

      router.push(`/admin/audit?${newParams.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    router.push("/admin/audit");
  };

  const hasActiveFilters = !!(
    params.action ||
    params.entityType ||
    params.userId ||
    params.from ||
    params.to ||
    params.search
  );

  return (
    <div className="space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex items-center gap-3">
        <form
          className="flex-1 max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            updateParams({ search: formData.get("search") as string });
          }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="search"
              placeholder="SEARCH AUDIT LOGS..."
              defaultValue={params.search}
              className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-xs font-bold tracking-wider placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all uppercase"
            />
          </div>
        </form>

        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="rounded-full font-bold text-[10px] uppercase tracking-wider"
        >
          <Filter className="mr-2 h-3 w-3" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 h-4 w-4 rounded-full bg-primary-foreground text-primary text-[10px] flex items-center justify-center">
              !
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="rounded-full font-bold text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-muted/50 rounded-xl border">
          {/* Action Filter */}
          <div>
            <label
              htmlFor="action-filter"
              className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Action
            </label>
            <select
              id="action-filter"
              value={params.action || "all"}
              onChange={(e) => updateParams({ action: e.target.value })}
              className="w-full rounded-lg border border-border bg-card py-2 px-3 text-xs font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            >
              <option value="all">All Actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <label
              htmlFor="type-filter"
              className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Entity Type
            </label>
            <select
              id="type-filter"
              value={params.entityType || "all"}
              onChange={(e) => updateParams({ entityType: e.target.value })}
              className="w-full rounded-lg border border-border bg-card py-2 px-3 text-xs font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            >
              <option value="all">All Types</option>
              {entityTypes.map((type) => (
                <option key={type} value={type}>
                  {entityLabels[type]}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div>
            <label
              htmlFor="user-filter"
              className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              User
            </label>
            <select
              id="user-filter"
              value={params.userId || "all"}
              onChange={(e) => updateParams({ userId: e.target.value })}
              className="w-full rounded-lg border border-border bg-card py-2 px-3 text-xs font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            >
              <option value="all">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id.toString()}>
                  {user.name} ({user.employeeId})
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label
              htmlFor="from-filter"
              className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              From Date
            </label>
            <input
              id="from-filter"
              value={params.from || ""}
              onChange={(e) => updateParams({ from: e.target.value })}
              className="w-full rounded-lg border border-border bg-card py-2 px-3 text-xs font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          {/* Date To */}
          <div>
            <label
              htmlFor="to-filter"
              className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              To Date
            </label>
            <input
              id="to-filter"
              type="date"
              value={params.to || ""}
              onChange={(e) => updateParams({ to: e.target.value })}
              className="w-full rounded-lg border border-border bg-card py-2 px-3 text-xs font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-xs text-muted-foreground font-medium">
        Showing {logs.length} of {pagination.total} entries
      </div>

      {/* Logs Table */}
      {logs.length === 0 ? (
        <EmptyState
          title="No audit logs found"
          description={
            hasActiveFilters
              ? "Try adjusting your filters to find what you're looking for."
              : "System activity will appear here as users interact with the application."
          }
          icon={Activity}
        />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Timestamp
                </th>
                <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Action
                </th>
                <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Entity
                </th>
                <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  User
                </th>
                <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => {
                const isExpanded = expandedLog === log.id;
                let parsedDetails: Record<string, unknown> | null = null;

                if (log.details) {
                  try {
                    parsedDetails =
                      typeof log.details === "string"
                        ? JSON.parse(log.details)
                        : (log.details as Record<string, unknown>);
                  } catch {
                    parsedDetails = null;
                  }
                }

                return (
                  <tr
                    key={log.id}
                    tabIndex={0}
                    // biome-ignore lint/a11y/useSemanticElements: Interactive row
                    role="button"
                    className={cn(
                      "hover:bg-muted/30 transition-colors cursor-pointer",
                      isExpanded && "bg-muted/20"
                    )}
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setExpandedLog(isExpanded ? null : log.id);
                      }
                    }}
                  >
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium">
                        {log.createdAt.toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {log.createdAt.toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={cn(
                          "font-bold text-[10px] uppercase tracking-wider gap-1",
                          actionColors[log.action] ||
                            "bg-slate-100 text-slate-700"
                        )}
                      >
                        {actionIcons[log.action]}
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {entityLabels[log.entityType]}
                        </span>
                        <Link
                          href={`${entityLinks[log.entityType]}/${log.entityId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline"
                        >
                          <span className="text-[10px] text-muted-foreground">
                            #{log.entityId}
                          </span>
                          <ExternalLink className="inline h-3 w-3 ml-1" />
                        </Link>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {log.user ? (
                        <div>
                          <div className="text-xs font-medium">
                            {log.user.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {log.user.employeeId}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          System
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {parsedDetails ? (
                        <div className="max-w-xs">
                          {isExpanded ? (
                            <pre className="text-[10px] font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(parsedDetails, null, 2)}
                            </pre>
                          ) : (
                            <span className="text-xs text-muted-foreground truncate block">
                              {Object.keys(parsedDetails)
                                .slice(0, 3)
                                .join(", ")}
                              {Object.keys(parsedDetails).length > 3 && "..."}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() =>
                updateParams({ page: (pagination.page - 1).toString() })
              }
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() =>
                updateParams({ page: (pagination.page + 1).toString() })
              }
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
