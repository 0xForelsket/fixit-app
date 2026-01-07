import { db } from "@/db";
import { equipment, spareParts, workOrders } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { formatWorkOrderId, getWorkOrderPath } from "@/lib/format-ids";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { eq, like, or, sql } from "drizzle-orm";

export type SearchResult = {
  id: string;
  type: "work_order" | "equipment" | "part" | "page";
  title: string;
  subtitle?: string;
  href: string;
  icon?: string;
};

// Static pages for navigation
const STATIC_PAGES: SearchResult[] = [
  {
    id: "page-dashboard",
    type: "page",
    title: "Dashboard",
    subtitle: "Technician terminal",
    href: "/dashboard",
  },
  {
    id: "page-work-orders",
    type: "page",
    title: "Work Orders",
    subtitle: "View all work orders",
    href: "/maintenance/work-orders",
  },
  {
    id: "page-equipment",
    type: "page",
    title: "Equipment",
    subtitle: "Asset management",
    href: "/assets/equipment",
  },
  {
    id: "page-inventory",
    type: "page",
    title: "Inventory",
    subtitle: "Spare parts",
    href: "/assets/inventory/parts",
  },
  {
    id: "page-analytics",
    type: "page",
    title: "Analytics",
    subtitle: "KPIs and reports",
    href: "/analytics",
  },
  {
    id: "page-settings",
    type: "page",
    title: "Settings",
    subtitle: "Account preferences",
    href: "/profile/settings",
  },
  {
    id: "page-users",
    type: "page",
    title: "Users",
    subtitle: "User management",
    href: "/admin/users",
  },
  {
    id: "page-roles",
    type: "page",
    title: "Roles",
    subtitle: "Role management",
    href: "/admin/roles",
  },
];

export async function GET(request: Request) {
  const requestId = generateRequestId();

  try {
    // Rate limiting for expensive full-text search operations
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(
      `search:${clientIp}`,
      RATE_LIMITS.search.limit,
      RATE_LIMITS.search.windowMs
    );

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      return ApiErrors.rateLimited(retryAfter, requestId);
    }

    const user = await getCurrentUser();
    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query || query.length < 2) {
      return apiSuccess([]);
    }

    const results: SearchResult[] = [];
    const searchPattern = `%${query}%`;

    // Search pages first (instant, no DB)
    const matchingPages = STATIC_PAGES.filter(
      (page) =>
        page.title.toLowerCase().includes(query.toLowerCase()) ||
        page.subtitle?.toLowerCase().includes(query.toLowerCase())
    );
    results.push(...matchingPages);

    // Check if query looks like a work order ID (e.g., #123 or just 123)
    const workOrderIdMatch = query.match(/^#?(\d+)$/);
    if (workOrderIdMatch) {
      const woDisplayId = Number(workOrderIdMatch[1]);
      const workOrder = await db.query.workOrders.findFirst({
        where: eq(workOrders.displayId, woDisplayId),
        columns: { id: true, displayId: true, title: true, status: true },
      });
      if (workOrder) {
        results.push({
          id: `wo-${workOrder.id}`,
          type: "work_order",
          title: `${formatWorkOrderId(workOrder.displayId)}: ${workOrder.title}`,
          subtitle: `Work Order - ${workOrder.status}`,
          href: getWorkOrderPath(workOrder.displayId),
        });
      }
    }

    // Execute database searches in parallel
    const [workOrderResults, equipmentResults, partResults] = await Promise.all(
      [
        // Search work orders
        db.query.workOrders.findMany({
          where: sql`to_tsvector('english', ${workOrders.title} || ' ' || ${workOrders.description}) @@ plainto_tsquery('english', ${query})`,
          columns: { id: true, displayId: true, title: true, status: true },
          limit: 5,
        }),
        // Search equipment
        db.query.equipment.findMany({
          where: sql`to_tsvector('english', ${equipment.name} || ' ' || ${equipment.code}) @@ plainto_tsquery('english', ${query})`,
          columns: { id: true, name: true, code: true, status: true },
          limit: 5,
        }),
        // Search spare parts
        db.query.spareParts.findMany({
          where: or(
            like(spareParts.name, searchPattern),
            like(spareParts.sku, searchPattern)
          ),
          columns: { id: true, name: true, sku: true },
          limit: 5,
        }),
      ]
    );

    // Process Work Order Results
    for (const wo of workOrderResults) {
      // Avoid duplicates if we already found by ID
      if (!results.some((r) => r.id === `wo-${wo.id}`)) {
        results.push({
          id: `wo-${wo.id}`,
          type: "work_order",
          title: `${formatWorkOrderId(wo.displayId)}: ${wo.title}`,
          subtitle: `Work Order - ${wo.status}`,
          href: getWorkOrderPath(wo.displayId),
        });
      }
    }

    // Process Equipment Results
    for (const eq of equipmentResults) {
      results.push({
        id: `eq-${eq.id}`,
        type: "equipment",
        title: eq.name,
        subtitle: `${eq.code} - ${eq.status}`,
        href: `/assets/equipment/${eq.code}`,
      });
    }

    // Process Part Results
    for (const part of partResults) {
      results.push({
        id: `part-${part.id}`,
        type: "part",
        title: part.name,
        subtitle: part.sku ?? "No SKU",
        href: `/assets/inventory/parts/${part.id}`,
      });
    }

    return apiSuccess(results.slice(0, 15));
  } catch (error) {
    apiLogger.error({ requestId, error }, "Search error");
    return ApiErrors.internal(error, requestId);
  }
}
