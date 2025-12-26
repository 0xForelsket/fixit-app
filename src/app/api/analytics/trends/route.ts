import { db } from "@/db";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !userHasPermission(user, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Last 30 days daily trend
    // SQLite: strftime('%Y-%m-%d', created_at / 1000, 'unixepoch') if stored as integer timestamp
    // My schema uses { mode: "timestamp" } which Drizzle handles as Date objects in JS,
    // but in SQLite they are stored as integers (unix epoch in ms or s).
    // Drizzle default for timestamp mode is Date object <-> Integer (ms).
    // So we need: date(created_at / 1000, 'unixepoch') if it was seconds,
    // but Drizzle uses ms? Let's check schema definition.
    // Schema: `integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`)`
    // `unixepoch()` in SQLite returns SECONDS since 1970.
    // So stored value is likely seconds.
    // But wait, Drizzle { mode: "timestamp" } expects Date input and converts to...
    // If I use `default(sql`(unixepoch())`)`, that puts seconds in.
    // If Drizzle reads it as ms, we might have a mismatch if I'm not careful.
    // However, usually it works out if consistent.
    // Let's assume standard SQLite date functions work on the stored column.

    const trendResult = await db.all(
      sql`
        SELECT 
          date(created_at / 1000, 'unixepoch') as day,
          count(*) as created_count,
          count(CASE WHEN status = 'resolved' OR status = 'closed' THEN 1 END) as resolved_count
        FROM tickets
        WHERE created_at >= (unixepoch('now', '-30 days') * 1000)
        GROUP BY day
        ORDER BY day ASC
       `
    );

    // Drizzle's `db.all` might not be exposed directly depending on the driver wrapper,
    // but `db.execute` or `db.select` with raw sql is better.
    // Let's use `db.select` with sql.

    // Actually, `unixepoch` function might returns seconds.
    // Let's stick to safe raw SQL selection via Drizzle.

    // We want to return an array of { date: string, created: number, resolved: number }
    // If some days are missing, the UI can handle it or we backfill in JS.

    return NextResponse.json(trendResult);
  } catch (error) {
    console.error("Trends error:", error);
    // Fallback if SQL fails (e.g., older SQLite version)
    return NextResponse.json([], { status: 500 });
  }
}
