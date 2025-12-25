import {
  CreateBucketCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";

/**
 * MinIO bucket setup script
 * Run: bun run minio:setup
 */

const s3Config = {
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  region: process.env.S3_REGION || "us-east-1",
  bucket: process.env.S3_BUCKET || "fixit-attachments",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
  },
};

const s3Client = new S3Client({
  endpoint: s3Config.endpoint,
  region: s3Config.region,
  credentials: s3Config.credentials,
  forcePathStyle: true,
});

async function setupBucket() {
  console.log("🪣 Setting up MinIO bucket...");
  console.log(`   Endpoint: ${s3Config.endpoint}`);
  console.log(`   Bucket: ${s3Config.bucket}`);

  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: s3Config.bucket }));
    console.log(`✅ Bucket '${s3Config.bucket}' already exists`);
  } catch (error: unknown) {
    const err = error as { name?: string };
    if (err.name === "NotFound" || err.name === "NoSuchBucket") {
      // Create the bucket
      console.log(`📦 Creating bucket '${s3Config.bucket}'...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: s3Config.bucket }));
      console.log(`✅ Bucket '${s3Config.bucket}' created successfully`);
    } else {
      throw error;
    }
  }

  console.log("\n🚀 MinIO setup complete!");
  console.log("   Console: http://localhost:9001");
  console.log("   Login: minioadmin / minioadmin");
}

setupBucket()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });
