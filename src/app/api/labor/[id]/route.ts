import { db } from "@/db";
import { laborLogs } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/labor/[id] - Get single labor log
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const logId = Number.parseInt(id);

    if (Number.isNaN(logId)) {
      return NextResponse.json({ error: "Invalid log ID" }, { status: 400 });
    }

    const log = await db.query.laborLogs.findFirst({
      where: eq(laborLogs.id, logId),
      with: {
        user: true,
        ticket: true,
      },
    });

    if (!log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error("Error fetching labor log:", error);
    return NextResponse.json(
      { error: "Failed to fetch labor log" },
      { status: 500 }
    );
  }
}

// DELETE /api/labor/[id] - Delete labor log
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const logId = Number.parseInt(id);

    if (Number.isNaN(logId)) {
      return NextResponse.json({ error: "Invalid log ID" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(laborLogs)
      .where(eq(laborLogs.id, logId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting labor log:", error);
    return NextResponse.json(
      { error: "Failed to delete labor log" },
      { status: 500 }
    );
  }
}
