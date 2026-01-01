import { createAttachment } from "@/actions/attachments";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
  },
}));

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";

describe("attachments actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAttachment", () => {
    it("should return error when not logged in", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await createAttachment({
        entityType: "work_order",
        entityId: 1,
        type: "photo",
        filename: "test.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
        s3Key: "uploads/test.jpg",
      });

      expect(result.error).toBe("Unauthorized");
      expect(result.success).toBeUndefined();
    });

    it("should return error for invalid data", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 1,
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: 2,
        sessionVersion: 1, permissions: ["ticket:view"],
      });

      const result = await createAttachment({
        entityType: "invalid_type" as "work_order",
        entityId: 1,
        type: "photo",
        filename: "test.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
        s3Key: "uploads/test.jpg",
      });

      expect(result.error).toBe("Invalid attachment data");
    });

    it("should return error when s3Key is missing", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 1,
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: 2,
        sessionVersion: 1, permissions: ["ticket:view"],
      });

      const result = await createAttachment({
        entityType: "work_order",
        entityId: 1,
        type: "photo",
        filename: "test.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
        s3Key: "", // Empty s3Key
      });

      expect(result.error).toBe("S3 Key is required");
    });

    it("should create attachment successfully for work order", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 1,
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: 2,
        sessionVersion: 1, permissions: ["ticket:view"],
      });

      const mockAttachment = {
        id: 1,
        entityType: "work_order",
        entityId: 5,
        type: "photo",
        filename: "issue.jpg",
        s3Key: "uploads/issue.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 2048,
        uploadedById: 1,
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([mockAttachment]),
        })),
      } as unknown as ReturnType<typeof db.insert>);

      const result = await createAttachment({
        entityType: "work_order",
        entityId: 5,
        type: "photo",
        filename: "issue.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 2048,
        s3Key: "uploads/issue.jpg",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAttachment);
    });

    it("should create attachment successfully for equipment", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 1,
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: 2,
        sessionVersion: 1, permissions: ["equipment:view"],
      });

      const mockAttachment = {
        id: 2,
        entityType: "equipment",
        entityId: 10,
        type: "document",
        filename: "manual.pdf",
        s3Key: "uploads/manual.pdf",
        mimeType: "application/pdf",
        sizeBytes: 50000,
        uploadedById: 1,
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([mockAttachment]),
        })),
      } as unknown as ReturnType<typeof db.insert>);

      const result = await createAttachment({
        entityType: "equipment",
        entityId: 10,
        type: "document",
        filename: "manual.pdf",
        mimeType: "application/pdf",
        sizeBytes: 50000,
        s3Key: "uploads/manual.pdf",
      });

      expect(result.success).toBe(true);
      expect(result.data?.entityType).toBe("equipment");
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 1,
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: 2,
        sessionVersion: 1, permissions: ["ticket:view"],
      });

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn(() => ({
          returning: vi
            .fn()
            .mockRejectedValue(new Error("DB connection failed")),
        })),
      } as unknown as ReturnType<typeof db.insert>);

      const result = await createAttachment({
        entityType: "work_order",
        entityId: 1,
        type: "photo",
        filename: "test.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
        s3Key: "uploads/test.jpg",
      });

      expect(result.error).toBe("Database error");
      expect(result.success).toBeUndefined();
    });

    it("should accept different attachment types", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 1,
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: 2,
        sessionVersion: 1, permissions: ["ticket:view"],
      });

      const attachmentTypes = ["photo", "document", "before", "after"] as const;

      for (const type of attachmentTypes) {
        vi.mocked(db.insert).mockReturnValue({
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                id: 1,
                entityType: "work_order",
                entityId: 1,
                type,
                filename: "test.jpg",
                s3Key: "uploads/test.jpg",
                mimeType: "image/jpeg",
                sizeBytes: 1024,
                uploadedById: 1,
                createdAt: new Date(),
              },
            ]),
          })),
        } as unknown as ReturnType<typeof db.insert>);

        const result = await createAttachment({
          entityType: "work_order",
          entityId: 1,
          type,
          filename: "test.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 1024,
          s3Key: "uploads/test.jpg",
        });

        expect(result.success).toBe(true);
      }
    });
  });
});
