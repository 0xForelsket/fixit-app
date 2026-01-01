import { getPresignedUploadUrl } from "@/lib/s3";
import { getCurrentUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { filename, mimeType, entityType, entityId } = result.data;

    // Generate a unique key
    const ext = filename.split(".").pop() || "bin";
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    // e.g. work_orders/123/1735839281-abc12.jpg
    const s3Key = `${entityType}s/${entityId}/${timestamp}-${random}.${ext}`;

    const uploadUrl = await getPresignedUploadUrl(s3Key, mimeType);

    return NextResponse.json({ uploadUrl, s3Key });
  } catch (error) {
    console.error("Failed to generate presigned URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
