import { db } from "@/db";
import { attachments } from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { deleteObject, getPresignedDownloadUrl } from "@/lib/s3";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/attachments/[id] - Get presigned download URL
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const attachmentId = Number.parseInt(id, 10);
    if (Number.isNaN(attachmentId)) {
      return NextResponse.json(
        { error: "Invalid attachment ID" },
        { status: 400 }
      );
    }

    const attachment = await db.query.attachments.findFirst({
      where: eq(attachments.id, attachmentId),
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    const downloadUrl = await getPresignedDownloadUrl(attachment.s3Key);

    return NextResponse.json({
      attachment,
      downloadUrl,
    });
  } catch (error) {
    console.error("Failed to get attachment:", error);
    return NextResponse.json(
      { error: "Failed to get attachment" },
      { status: 500 }
    );
  }
}

// DELETE /api/attachments/[id] - Delete attachment
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const attachmentId = Number.parseInt(id, 10);
    if (Number.isNaN(attachmentId)) {
      return NextResponse.json(
        { error: "Invalid attachment ID" },
        { status: 400 }
      );
    }

    const attachment = await db.query.attachments.findFirst({
      where: eq(attachments.id, attachmentId),
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    const isOwner = attachment.uploadedById === user.id;
    const canDeleteAny = userHasPermission(user, PERMISSIONS.ALL);
    if (!isOwner && !canDeleteAny) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from S3
    try {
      await deleteObject(attachment.s3Key);
    } catch (s3Error) {
      console.warn("Failed to delete from S3 (may not exist):", s3Error);
    }

    // Delete from database
    await db.delete(attachments).where(eq(attachments.id, attachmentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete attachment:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
