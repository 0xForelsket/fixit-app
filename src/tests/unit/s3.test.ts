import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mocks
const mockSend = vi.fn();
const mockGetSignedUrl = vi.fn();

// Mock AWS SDK
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = mockSend;
  },
  PutObjectCommand: class {
    constructor(public config: any) {}
  },
  GetObjectCommand: class {
    constructor(public config: any) {}
  },
  DeleteObjectCommand: class {
    constructor(public config: any) {}
  },
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

const {
  deleteObject,
  generateAvatarKey,
  generateS3Key,
  getPresignedDownloadUrl,
  getPresignedUploadUrl,
  getS3Config,
  uploadFile,
} = await import("@/lib/s3");

describe("S3 Utilities", () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockGetSignedUrl.mockClear();
  });

  describe("generateS3Key", () => {
    it("generates correct key for work_order entity", () => {
      const key = generateS3Key("work_order", "123", "456", "document.pdf");
      expect(key).toBe("work_orders/123/456.pdf");
    });

    it("generates correct key for equipment entity", () => {
      const key = generateS3Key("equipment", "42", "99", "photo.jpg");
      expect(key).toBe("equipments/42/99.jpg");
    });

    it("generates correct key for spare_part entity", () => {
      const key = generateS3Key("spare_part", "10", "20", "specs.docx");
      expect(key).toBe("spare_parts/10/20.docx");
    });

    it("extracts extension from filename", () => {
      const key = generateS3Key("work_order", "1", "1", "report.final.xlsx");
      expect(key).toBe("work_orders/1/1.xlsx");
    });

    it("uses filename as extension when no dot present", () => {
      const key = generateS3Key("work_order", "1", "1", "noextension");
      expect(key).toBe("work_orders/1/1.noextension");
    });

    it("uses bin extension for empty filename", () => {
      const key = generateS3Key("work_order", "1", "1", "");
      expect(key).toBe("work_orders/1/1.bin");
    });
  });

  describe("generateAvatarKey", () => {
    it("generates correct key for user avatar", () => {
      const key = generateAvatarKey("42", "profile.jpg");
      expect(key).toBe("users/42/avatar.jpg");
    });

    it("extracts extension from filename", () => {
      const key = generateAvatarKey("1", "photo.png");
      expect(key).toBe("users/1/avatar.png");
    });

    it("uses filename as extension when no dot present", () => {
      const key = generateAvatarKey("1", "avatar");
      expect(key).toBe("users/1/avatar.avatar");
    });

    it("handles files with multiple dots", () => {
      const key = generateAvatarKey("1", "my.profile.photo.webp");
      expect(key).toBe("users/1/avatar.webp");
    });
  });

  describe("getPresignedUploadUrl", () => {
    it("generates presigned upload URL", async () => {
      mockGetSignedUrl.mockResolvedValue(
        "https://s3.example.com/presigned-url"
      );

      const url = await getPresignedUploadUrl(
        "test/key.pdf",
        "application/pdf"
      );

      expect(url).toBe("https://s3.example.com/presigned-url");
      expect(mockGetSignedUrl).toHaveBeenCalled();
    });
  });

  describe("getPresignedDownloadUrl", () => {
    it("generates presigned download URL", async () => {
      mockGetSignedUrl.mockResolvedValue("https://s3.example.com/download-url");

      const url = await getPresignedDownloadUrl("test/key.pdf");

      expect(url).toBe("https://s3.example.com/download-url");
      expect(mockGetSignedUrl).toHaveBeenCalled();
    });
  });

  describe("deleteObject", () => {
    it("calls send to delete object", async () => {
      mockSend.mockResolvedValue({});

      await deleteObject("test/key.pdf");

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe("uploadFile", () => {
    it("calls send to upload file", async () => {
      mockSend.mockResolvedValue({});
      const content = Buffer.from("test content");

      await uploadFile("test/key.txt", content, "text/plain");

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe("getS3Config", () => {
    it("returns S3 configuration", () => {
      const config = getS3Config();

      expect(config.bucket).toBe("fixit-attachments");
      expect(config.region).toBe("us-east-1");
      expect(typeof config.endpoint).toBe("string");
    });
  });
});
