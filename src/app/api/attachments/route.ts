import { db } from "@/db";
import { attachments, type AttachmentType, type EntityType } from "@/db/schema";
import { generateS3Key, getPresignedUploadUrl } from "@/lib/s3";
import { getCurrentUser } from "@/lib/session";
import { eq, and } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/attachments - List attachments for an entity
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get("entityType") as EntityType | null;
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    const entityIdNum = Number.parseInt(entityId, 10);
    if (Number.isNaN(entityIdNum)) {
      return NextResponse.json({ error: "Invalid entityId" }, { status: 400 });
    }

    const attachmentList = await db.query.attachments.findMany({
      where: and(
        eq(attachments.entityType, entityType),
        eq(attachments.entityId, entityIdNum)
      ),
      with: {
        uploadedBy: true,
      },
    });

    return NextResponse.json({ attachments: attachmentList });
  } catch (error) {
    console.error("Failed to list attachments:", error);
    return NextResponse.json(
      { error: "Failed to list attachments" },
      { status: 500 }
    );
  }
}

// POST /api/attachments - Create attachment record and get upload URL
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { entityType, entityId, attachmentType, filename, mimeType, sizeBytes } = body;

    // Validate required fields
    if (!entityType || !entityId || !attachmentType || !filename || !mimeType || !sizeBytes) {
      return NextResponse.json(
        { error: "Missing required fields: entityType, entityId, attachmentType, filename, mimeType, sizeBytes" },
        { status: 400 }
      );
    }

    // Create attachment record first to get ID
    const [attachment] = await db
      .insert(attachments)
      .values({
        entityType: entityType as EntityType,
        entityId: Number(entityId),
        type: attachmentType as AttachmentType,
        filename,
        s3Key: "", // Will update after we have the full key
        mimeType,
        sizeBytes: Number(sizeBytes),
        uploadedById: user.id,
      })
      .returning();

    // Generate S3 key using attachment ID
    const s3Key = generateS3Key(entityType, entityId, attachment.id, filename);

    // Update attachment with S3 key
    await db
      .update(attachments)
      .set({ s3Key })
      .where(eq(attachments.id, attachment.id));

    // Generate presigned upload URL
    const uploadUrl = await getPresignedUploadUrl(s3Key, mimeType);

    return NextResponse.json({
      attachment: { ...attachment, s3Key },
      uploadUrl,
    });
  } catch (error) {
    console.error("Failed to create attachment:", error);
    return NextResponse.json(
      { error: "Failed to create attachment" },
      { status: 500 }
    );
  }
}
