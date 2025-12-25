import { getCurrentUser } from "@/lib/session";
import { getPresignedUploadUrl } from "@/lib/s3";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename, mimeType, entityType, entityId } = await request.json();

    if (!filename || !mimeType || !entityType || !entityId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate a unique S3 key
    // Pattern: {entityType}s/{entityId}/{uuid}-{filename}
    const fileExtension = filename.split(".").pop();
    const s3Key = `${entityType}s/${entityId}/${crypto.randomUUID()}.${fileExtension}`;

    const uploadUrl = await getPresignedUploadUrl(s3Key, mimeType);

    return NextResponse.json({ uploadUrl, s3Key });
  } catch (error) {
    console.error("Failed to generate presigned URL:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
