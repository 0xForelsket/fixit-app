import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock AWS SDK
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(() => ({
    send: vi.fn(),
  })),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

import {
  generateS3Key,
  generateAvatarKey,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  deleteObject,
  uploadFile,
  getS3Config,
  s3Client,
} from "@/lib/s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

describe("S3 Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateS3Key", () => {
    it("generates correct key for work_order entity", () => {
      const key = generateS3Key("work_order", 123, 456, "document.pdf");
      expect(key).toBe("work_orders/123/456.pdf");
    });

    it("generates correct key for equipment entity", () => {
      const key = generateS3Key("equipment", 42, 99, "photo.jpg");
      expect(key).toBe("equipments/42/99.jpg");
    });

    it("generates correct key for part entity", () => {
      const key = generateS3Key("part", 10, 20, "specs.docx");
      expect(key).toBe("parts/10/20.docx");
    });

    it("extracts extension from filename", () => {
      const key = generateS3Key("work_order", 1, 1, "report.final.xlsx");
      expect(key).toBe("work_orders/1/1.xlsx");
    });

    it("uses bin extension for files without extension", () => {
      const key = generateS3Key("work_order", 1, 1, "noextension");
      expect(key).toBe("work_orders/1/1.bin");
    });

    it("handles empty filename gracefully", () => {
      const key = generateS3Key("work_order", 1, 1, "");
      expect(key).toBe("work_orders/1/1.");
    });
  });

  describe("generateAvatarKey", () => {
    it("generates correct key for user avatar", () => {
      const key = generateAvatarKey(42, "profile.jpg");
      expect(key).toBe("users/42/avatar.jpg");
    });

    it("extracts extension from filename", () => {
      const key = generateAvatarKey(1, "photo.png");
      expect(key).toBe("users/1/avatar.png");
    });

    it("uses jpg extension for files without extension", () => {
      const key = generateAvatarKey(1, "avatar");
      expect(key).toBe("users/1/avatar.jpg");
    });

    it("handles files with multiple dots", () => {
      const key = generateAvatarKey(1, "my.profile.photo.webp");
      expect(key).toBe("users/1/avatar.webp");
    });
  });

  describe("getPresignedUploadUrl", () => {
    it("generates presigned upload URL with default expiry", async () => {
      vi.mocked(getSignedUrl).mockResolvedValue("https://s3.example.com/presigned-url");

      const url = await getPresignedUploadUrl("test/key.pdf", "application/pdf");

      expect(url).toBe("https://s3.example.com/presigned-url");
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: "fixit-attachments",
        Key: "test/key.pdf",
        ContentType: "application/pdf",
      });
      expect(getSignedUrl).toHaveBeenCalledWith(
        s3Client,
        expect.any(Object),
        { expiresIn: 3600 }
      );
    });

    it("generates presigned upload URL with custom expiry", async () => {
      vi.mocked(getSignedUrl).mockResolvedValue("https://s3.example.com/presigned-url");

      await getPresignedUploadUrl("test/key.pdf", "application/pdf", 7200);

      expect(getSignedUrl).toHaveBeenCalledWith(
        s3Client,
        expect.any(Object),
        { expiresIn: 7200 }
      );
    });
  });

  describe("getPresignedDownloadUrl", () => {
    it("generates presigned download URL with default expiry", async () => {
      vi.mocked(getSignedUrl).mockResolvedValue("https://s3.example.com/download-url");

      const url = await getPresignedDownloadUrl("test/key.pdf");

      expect(url).toBe("https://s3.example.com/download-url");
      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: "fixit-attachments",
        Key: "test/key.pdf",
      });
      expect(getSignedUrl).toHaveBeenCalledWith(
        s3Client,
        expect.any(Object),
        { expiresIn: 3600 }
      );
    });

    it("generates presigned download URL with custom expiry", async () => {
      vi.mocked(getSignedUrl).mockResolvedValue("https://s3.example.com/download-url");

      await getPresignedDownloadUrl("test/key.pdf", 1800);

      expect(getSignedUrl).toHaveBeenCalledWith(
        s3Client,
        expect.any(Object),
        { expiresIn: 1800 }
      );
    });
  });

  describe("deleteObject", () => {
    it("deletes object from S3", async () => {
      const mockSend = vi.fn().mockResolvedValue({});
      (s3Client.send as ReturnType<typeof vi.fn>) = mockSend;

      await deleteObject("test/key.pdf");

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: "fixit-attachments",
        Key: "test/key.pdf",
      });
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe("uploadFile", () => {
    it("uploads file to S3", async () => {
      const mockSend = vi.fn().mockResolvedValue({});
      (s3Client.send as ReturnType<typeof vi.fn>) = mockSend;
      const content = Buffer.from("test content");

      await uploadFile("test/key.txt", content, "text/plain");

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: "fixit-attachments",
        Key: "test/key.txt",
        Body: content,
        ContentType: "text/plain",
      });
      expect(mockSend).toHaveBeenCalled();
    });

    it("uploads string content to S3", async () => {
      const mockSend = vi.fn().mockResolvedValue({});
      (s3Client.send as ReturnType<typeof vi.fn>) = mockSend;

      await uploadFile("test/key.txt", "string content", "text/plain");

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: "fixit-attachments",
        Key: "test/key.txt",
        Body: "string content",
        ContentType: "text/plain",
      });
    });
  });

  describe("getS3Config", () => {
    it("returns S3 configuration", () => {
      const config = getS3Config();

      expect(config).toEqual({
        bucket: "fixit-attachments",
        endpoint: "http://localhost:9000",
        region: "us-east-1",
      });
    });
  });
});
