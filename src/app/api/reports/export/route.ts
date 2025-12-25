import { db } from "@/db";
import { type TicketPriority, type TicketStatus, tickets } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const conditions = [];

    if (status && status !== "all") {
      conditions.push(eq(tickets.status, status as TicketStatus));
    }

    if (priority && priority !== "all") {
      conditions.push(eq(tickets.priority, priority as TicketPriority));
    }

    if (from) {
      const fromDate = new Date(from);
      conditions.push(gte(tickets.createdAt, fromDate));
    }

    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(tickets.createdAt, toDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const ticketsList = await db.query.tickets.findMany({
      where: whereClause,
      orderBy: [desc(tickets.createdAt)],
      with: {
        machine: { with: { location: true } },
        reportedBy: true,
        assignedTo: true,
      },
    });

    // Build CSV content
    const headers = [
      "ID",
      "Title",
      "Description",
      "Machine",
      "Location",
      "Type",
      "Priority",
      "Status",
      "Reported By",
      "Assigned To",
      "Created At",
      "Resolved At",
      "Resolution Notes",
    ];

    const rows = ticketsList.map((ticket) => [
      ticket.id,
      escapeCSV(ticket.title),
      escapeCSV(ticket.description),
      escapeCSV(ticket.machine?.name || ""),
      escapeCSV(ticket.machine?.location?.name || ""),
      ticket.type,
      ticket.priority,
      ticket.status,
      escapeCSV(ticket.reportedBy?.name || ""),
      escapeCSV(ticket.assignedTo?.name || ""),
      formatDate(ticket.createdAt),
      ticket.resolvedAt ? formatDate(ticket.resolvedAt) : "",
      escapeCSV(ticket.resolutionNotes || ""),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Return as downloadable CSV
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="ticket-report-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Failed to export tickets:", error);
    return NextResponse.json(
      { error: "Failed to export tickets" },
      { status: 500 }
    );
  }
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(date: Date | number | string): string {
  const d = new Date(date);
  return d.toISOString().replace("T", " ").split(".")[0];
}
