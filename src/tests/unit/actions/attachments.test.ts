// Actions will be imported dynamically after mocks
import { PERMISSIONS as PERMISSIONS_SOURCE } from "@/lib/permissions";
import { beforeEach, describe, expect, it, mock } from "bun:test";

const mockGetCurrentUser = mock();
const mockInsert = mock();
const mockValues = mock();
const mockReturning = mock();

// Chainable mocks
mockInsert.mockReturnValue({ values: mockValues });
mockValues.mockReturnValue({ returning: mockReturning });

// Mock the db module
mock.module("@/db", () => ({
  db: {
    insert: mockInsert,
    // Add dummies to prevent crashes if other tests look for them
    query: {},
    update: mock(),
    delete: mock(() => ({ where: mock() })),
  },
}));

// Mock auth module
mock.module("@/lib/auth", () => ({
  hasPermission: mock((userPermissions: string[], required: string) => {
    if (userPermissions.includes("*")) return true;
    return userPermissions.includes(required);
  }),
  userHasPermission: mock((user, permission) => {
    if (user?.permissions?.includes("*")) return true;
    return user?.permissions?.includes(permission);
  }),
  PERMISSIONS: PERMISSIONS_SOURCE,
}));

// Mock session
mock.module("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

// Mock audit
mock.module("@/lib/audit", () => ({
  logAudit: mock(),
}));

const { createAttachment } = await import("@/actions/attachments");

describe("attachments actions", () => {
  beforeEach(() => {
    mockGetCurrentUser.mockClear();
    mockInsert.mockClear();
    mockValues.mockClear();
    mockReturning.mockClear();
  });

  describe("createAttachment", () => {
    it("should return error when not logged in", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await createAttachment({
        entityType: "work_order",
        entityId: "1",
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
      mockGetCurrentUser.mockResolvedValue({
        id: "1", displayId: 1,
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: "2",
        sessionVersion: 1,
        permissions: ["ticket:view"],
      });

      const result = await createAttachment({
        entityType: "invalid_type" as "work_order",
        entityId: "1",
        type: "photo",
        filename: "test.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
        s3Key: "uploads/test.jpg",
      });

      expect(result.error).toBe("Invalid attachment data");
    });

    it("should return error when s3Key is missing", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "1", displayId: 1,
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: "2",
        sessionVersion: 1,
        permissions: ["ticket:view"],
      });

      const result = await createAttachment({
        entityType: "work_order",
        entityId: "1",
        type: "photo",
        filename: "test.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
        s3Key: "", // Empty s3Key
      });

      expect(result.error).toBe("S3 Key is required");
    });

    it("should create attachment successfully for work order", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "1", displayId: 1,
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: "2",
        sessionVersion: 1,
        permissions: ["ticket:view"],
      });

      const mockAttachment = {
        id: "1", displayId: 1,
        entityType: "work_order" as any,
        entityId: "5",
        type: "photo" as any,
        filename: "issue.jpg",
        s3Key: "uploads/issue.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 2048,
        uploadedById: "1",
        createdAt: new Date(),
      };

      mockReturning.mockResolvedValue([mockAttachment]);

      const result = await createAttachment({
        entityType: "work_order",
        entityId: "5",
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
      mockGetCurrentUser.mockResolvedValue({
        id: "1", displayId: 1,
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: "2",
        sessionVersion: 1,
        permissions: ["equipment:view"],
      });

      const mockAttachment = {
        id: "2", displayId: 2,
        entityType: "equipment" as any,
        entityId: "10",
        type: "document" as any,
        filename: "manual.pdf",
        s3Key: "uploads/manual.pdf",
        mimeType: "application/pdf",
        sizeBytes: 50000,
        uploadedById: "1",
        createdAt: new Date(),
      };

      mockReturning.mockResolvedValue([mockAttachment]);

      const result = await createAttachment({
        entityType: "equipment",
        entityId: "10",
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
      mockGetCurrentUser.mockResolvedValue({
        id: "1", displayId: 1,
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: "2",
        sessionVersion: 1,
        permissions: ["ticket:view"],
      });

      mockReturning.mockRejectedValue(new Error("DB connection failed"));

      const result = await createAttachment({
        entityType: "work_order",
        entityId: "1",
        type: "photo",
        filename: "test.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
        s3Key: "uploads/test.jpg",
      });

      expect(result.error).toBe("Database error");
      // @ts-ignore
      expect(result.success).toBeUndefined();
    });

    it("should accept different attachment types", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "1", displayId: 1,
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: "2",
        sessionVersion: 1,
        permissions: ["ticket:view"],
      });

      const attachmentTypes = ["photo", "document", "before", "after"] as const;

      for (const type of attachmentTypes) {
        mockReturning.mockResolvedValue([
          {
            id: "1", displayId: 1,
            entityType: "work_order",
            entityId: "1",
            type: type as any,
            filename: "test.jpg",
            s3Key: "uploads/test.jpg",
            mimeType: "image/jpeg",
            sizeBytes: 1024,
            uploadedById: "1",
            createdAt: new Date(),
          },
        ]);

        const result = await createAttachment({
          entityType: "work_order",
          entityId: "1",
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
