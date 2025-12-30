import { db } from "@/db";
import { equipment, spareParts, workOrders } from "@/db/schema";
import { ApiErrors } from "@/lib/api-error";
import { generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { eq, ilike, or } from "drizzle-orm";
import { NextResponse } from "next/server";

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
    href: "/inventory/parts",
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
    const user = await getCurrentUser();
    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
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
      const woId = Number(workOrderIdMatch[1]);
      const workOrder = await db.query.workOrders.findFirst({
        where: eq(workOrders.id, woId),
        columns: { id: true, title: true, status: true },
      });
      if (workOrder) {
        results.push({
          id: `wo-${workOrder.id}`,
          type: "work_order",
          title: `#${workOrder.id}: ${workOrder.title}`,
          subtitle: `Work Order - ${workOrder.status}`,
          href: `/maintenance/work-orders/${workOrder.id}`,
        });
      }
    }

    // Search work orders by title
    const workOrderResults = await db.query.workOrders.findMany({
      where: or(
        ilike(workOrders.title, searchPattern),
        ilike(workOrders.description, searchPattern)
      ),
      columns: { id: true, title: true, status: true },
      limit: 5,
    });

    for (const wo of workOrderResults) {
      // Avoid duplicates if we already found by ID
      if (!results.some((r) => r.id === `wo-${wo.id}`)) {
        results.push({
          id: `wo-${wo.id}`,
          type: "work_order",
          title: `#${wo.id}: ${wo.title}`,
          subtitle: `Work Order - ${wo.status}`,
          href: `/maintenance/work-orders/${wo.id}`,
        });
      }
    }

    // Search equipment by name or code
    const equipmentResults = await db.query.equipment.findMany({
      where: or(
        ilike(equipment.name, searchPattern),
        ilike(equipment.code, searchPattern)
      ),
      columns: { id: true, name: true, code: true, status: true },
      limit: 5,
    });

    for (const eq of equipmentResults) {
      results.push({
        id: `eq-${eq.id}`,
        type: "equipment",
        title: eq.name,
        subtitle: `${eq.code} - ${eq.status}`,
        href: `/assets/equipment/${eq.id}`,
      });
    }

    // Search spare parts by name or SKU
    const partResults = await db.query.spareParts.findMany({
      where: or(
        ilike(spareParts.name, searchPattern),
        ilike(spareParts.sku, searchPattern)
      ),
      columns: { id: true, name: true, sku: true },
      limit: 5,
    });

    for (const part of partResults) {
      results.push({
        id: `part-${part.id}`,
        type: "part",
        title: part.name,
        subtitle: part.sku ?? "No SKU",
        href: `/inventory/parts/${part.id}`,
      });
    }

    return NextResponse.json({ results: results.slice(0, 15) });
  } catch (error) {
    console.error("Search error:", error);
    return ApiErrors.internal(error, requestId);
  }
}
