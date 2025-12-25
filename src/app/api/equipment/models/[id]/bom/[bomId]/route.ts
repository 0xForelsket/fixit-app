import { db } from "@/db";
import { equipmentBoms } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; bomId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bomId } = await params;

    await db
      .delete(equipmentBoms)
      .where(eq(equipmentBoms.id, Number.parseInt(bomId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting BOM item:", error);
    return NextResponse.json(
      { error: "Failed to delete BOM item" },
      { status: 500 }
    );
  }
}
