import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { db } from "@/db";
import { auditLogs, entityTypes, users } from "@/db/schema";
import { requirePermission } from "@/lib/session";
import { and, count, desc, eq, gte, like, lte, or } from "drizzle-orm";
import { Calendar, Download, LogIn, Pencil, Plus, Trash2 } from "lucide-react";
import { AuditLogTable } from "./audit-log-table";

type SearchParams = {
  page?: string;
  action?: string;
  entityType?: string;
  userId?: string;
  search?: string;
  from?: string;
  to?: string;
};

const ITEMS_PER_PAGE = 25;

async function getAuditLogs(params: SearchParams) {
  const page = Math.max(1, Number.parseInt(params.page || "1", 10));
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const conditions = [];

  if (params.action && params.action !== "all") {
    conditions.push(eq(auditLogs.action, params.action));
  }

  if (params.entityType && params.entityType !== "all") {
    conditions.push(
      eq(
        auditLogs.entityType,
        params.entityType as (typeof entityTypes)[number]
      )
    );
  }

  if (params.userId && params.userId !== "all") {
    conditions.push(eq(auditLogs.userId, params.userId));
  }

  if (params.search) {
    conditions.push(
      or(
        like(auditLogs.action, `%${params.search}%`),
        like(auditLogs.details, `%${params.search}%`)
      )
    );
  }

  if (params.from) {
    const fromDate = new Date(params.from);
    conditions.push(gte(auditLogs.createdAt, fromDate));
  }

  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(auditLogs.createdAt, toDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [logs, totalResult] = await Promise.all([
    db.query.auditLogs.findMany({
      where: whereClause,
      orderBy: [desc(auditLogs.createdAt)],
      with: {
        user: true,
      },
      limit: ITEMS_PER_PAGE,
      offset,
    }),
    db.select({ count: count() }).from(auditLogs).where(whereClause),
  ]);

  const total = totalResult[0]?.count || 0;

  return {
    logs,
    pagination: {
      page,
      totalPages: Math.ceil(total / ITEMS_PER_PAGE),
      total,
      hasNext: page * ITEMS_PER_PAGE < total,
      hasPrev: page > 1,
    },
  };
}

async function getAuditStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalResult, todayResult, weekResult, actionCounts] =
    await Promise.all([
      db.select({ count: count() }).from(auditLogs),
      db
        .select({ count: count() })
        .from(auditLogs)
        .where(gte(auditLogs.createdAt, today)),
      db
        .select({ count: count() })
        .from(auditLogs)
        .where(gte(auditLogs.createdAt, weekAgo)),
      db
        .select({
          action: auditLogs.action,
          count: count(),
        })
        .from(auditLogs)
        .groupBy(auditLogs.action),
    ]);

  const actionMap = Object.fromEntries(
    actionCounts.map((a) => [a.action, a.count])
  );

  return {
    total: totalResult[0]?.count || 0,
    today: todayResult[0]?.count || 0,
    thisWeek: weekResult[0]?.count || 0,
    creates: actionMap.CREATE || 0,
    updates: actionMap.UPDATE || 0,
    deletes: actionMap.DELETE || 0,
    logins: actionMap.LOGIN || 0,
  };
}

async function getAllUsers() {
  return db.query.users.findMany({
    columns: { id: true, name: true, employeeId: true },
    orderBy: [users.name],
  });
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission("system:settings");

  const params = await searchParams;
  const [{ logs, pagination }, stats, allUsers] = await Promise.all([
    getAuditLogs(params),
    getAuditStats(),
    getAllUsers(),
  ]);

  const actions = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"];

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Audit Log"
        subtitle="System Activity"
        description={`${stats.total} TOTAL ENTRIES • ${stats.today} TODAY`}
        bgSymbol="AU"
        actions={
          <Button
            variant="outline"
            asChild
            className="rounded-full border-2 font-black text-[10px] uppercase tracking-wider h-11 px-6 hover:bg-muted transition-all"
          >
            <a
              href={`/api/audit/export?${new URLSearchParams(
                Object.entries(params).filter(([_, v]) => v) as [
                  string,
                  string,
                ][]
              ).toString()}`}
              download
            >
              <Download className="mr-2 h-4 w-4" />
              EXPORT CSV
            </a>
          </Button>
        }
      />

      {/* Stats Ticker */}
      <StatsTicker
        stats={[
          {
            label: "This Week",
            value: stats.thisWeek,
            icon: Calendar,
            variant: "default",
          },
          {
            label: "Creates",
            value: stats.creates,
            icon: Plus,
            variant: "success",
          },
          {
            label: "Updates",
            value: stats.updates,
            icon: Pencil,
            variant: "primary",
          },
          {
            label: "Deletes",
            value: stats.deletes,
            icon: Trash2,
            variant: "danger",
          },
          {
            label: "Logins",
            value: stats.logins,
            icon: LogIn,
            variant: "default",
          },
        ]}
      />

      {/* Filters and Table */}
      <AuditLogTable
        logs={logs}
        pagination={pagination}
        params={params}
        users={allUsers}
        actions={actions}
        entityTypes={[...entityTypes]}
      />
    </PageContainer>
  );
}
