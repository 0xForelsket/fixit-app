import type { EntityType } from "@/db/schema";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3/MinIO configuration
const s3Config = {
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  region: process.env.S3_REGION || "us-east-1",
  bucket: process.env.S3_BUCKET || "fixit-attachments",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
  },
};

// Create S3 client
export const s3Client = new S3Client({
  endpoint: s3Config.endpoint,
  region: s3Config.region,
  credentials: s3Config.credentials,
  forcePathStyle: true, // Required for MinIO
});

// Generate S3 key based on entity type and ID
export function generateS3Key(
  entityType: EntityType,
  entityId: number,
  attachmentId: number,
  filename: string
): string {
  const ext = filename.split(".").pop() || "bin";
  return `${entityType}s/${entityId}/${attachmentId}.${ext}`;
}

// Generate S3 key for avatars
export function generateAvatarKey(userId: number, filename: string): string {
  const ext = filename.split(".").pop() || "jpg";
  return `users/${userId}/avatar.${ext}`;
}

// Generate presigned upload URL
export async function getPresignedUploadUrl(
  key: string,
  mimeType: string,
  expiresIn = 3600 // 1 hour default
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
    ContentType: mimeType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// Generate presigned download URL
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600 // 1 hour default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// Delete object from S3
export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
  });

  await s3Client.send(command);
}

// Upload file directly (for server-side uploads)
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  mimeType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
    Body: body,
    ContentType: mimeType,
  });

  await s3Client.send(command);
}

// Get bucket configuration
export function getS3Config() {
  return {
    bucket: s3Config.bucket,
    endpoint: s3Config.endpoint,
    region: s3Config.region,
  };
}
