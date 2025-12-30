import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    query: {
      attachments: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
  },
}));

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock rate limit
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({
    success: true,
    remaining: 9,
    reset: Date.now() + 60000,
  })),
  getClientIp: vi.fn(() => "127.0.0.1"),
  RATE_LIMITS: {
    upload: { limit: 10, windowMs: 60000 },
  },
}));

// Mock S3
vi.mock("@/lib/s3", () => ({
  generateS3Key: vi.fn(() => "work_orders/1/1.pdf"),
  getPresignedUploadUrl: vi.fn(() => "https://s3.example.com/presigned-upload"),
  getPresignedDownloadUrl: vi.fn(
    () => "https://s3.example.com/presigned-download"
  ),
  deleteObject: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  apiLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
  generateRequestId: vi.fn(() => "test-request-id"),
}));

import {
  DELETE,
  GET as GET_BY_ID,
} from "@/app/(app)/api/attachments/[id]/route";
import { GET, POST } from "@/app/(app)/api/attachments/route";
import { db } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { deleteObject } from "@/lib/s3";
import { getCurrentUser } from "@/lib/session";

describe("GET /api/attachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new Request(
      "http://localhost/api/attachments?entityType=work_order&entityId=1"
    ) as unknown as import("next/server").NextRequest;
    Object.defineProperty(request, "nextUrl", {
      value: new URL(
        "http://localhost/api/attachments?entityType=work_order&entityId=1"
      ),
    });

    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 when entityType is missing", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: 2,
      departmentId: 1,
      isActive: true,
      employeeId: "TECH-001",
      hourlyRate: 25.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const request = new Request(
      "http://localhost/api/attachments?entityId=1"
    ) as unknown as import("next/server").NextRequest;
    Object.defineProperty(request, "nextUrl", {
      value: new URL("http://localhost/api/attachments?entityId=1"),
    });

    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 when entityId is missing", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: 2,
      departmentId: 1,
      isActive: true,
      employeeId: "TECH-001",
      hourlyRate: 25.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const request = new Request(
      "http://localhost/api/attachments?entityType=work_order"
    ) as unknown as import("next/server").NextRequest;
    Object.defineProperty(request, "nextUrl", {
      value: new URL("http://localhost/api/attachments?entityType=work_order"),
    });

    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 when entityId is not a number", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: 2,
      departmentId: 1,
      isActive: true,
      employeeId: "TECH-001",
      hourlyRate: 25.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const request = new Request(
      "http://localhost/api/attachments?entityType=work_order&entityId=abc"
    ) as unknown as import("next/server").NextRequest;
    Object.defineProperty(request, "nextUrl", {
      value: new URL(
        "http://localhost/api/attachments?entityType=work_order&entityId=abc"
      ),
    });

    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it("returns attachments list", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: 2,
      departmentId: 1,
      isActive: true,
      employeeId: "TECH-001",
      hourlyRate: 25.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const mockAttachments = [
      {
        id: 1,
        entityType: "work_order" as const,
        entityId: 1,
        type: "document" as const,
        filename: "report.pdf",
        s3Key: "work_orders/1/report.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
        uploadedById: 1,
        createdAt: new Date(),
        uploadedBy: { id: 1, name: "Tech" },
      },
    ];
    vi.mocked(db.query.attachments.findMany).mockResolvedValue(mockAttachments);

    const request = new Request(
      "http://localhost/api/attachments?entityType=work_order&entityId=1"
    ) as unknown as import("next/server").NextRequest;
    Object.defineProperty(request, "nextUrl", {
      value: new URL(
        "http://localhost/api/attachments?entityType=work_order&entityId=1"
      ),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.attachments).toHaveLength(1);
    expect(data.data.attachments[0].filename).toBe("report.pdf");
  });
});

describe("POST /api/attachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const request = new Request("http://localhost/api/attachments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }) as unknown as import("next/server").NextRequest;
    Object.defineProperty(request, "nextUrl", {
      value: new URL("http://localhost/api/attachments"),
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({
      success: true,
      remaining: 9,
      reset: Date.now() + 60000,
    });
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new Request("http://localhost/api/attachments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }) as unknown as import("next/server").NextRequest;
    Object.defineProperty(request, "nextUrl", {
      value: new URL("http://localhost/api/attachments"),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({
      success: true,
      remaining: 9,
      reset: Date.now() + 60000,
    });
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: 2,
      departmentId: 1,
      isActive: true,
      employeeId: "TECH-001",
      hourlyRate: 25.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const request = new Request("http://localhost/api/attachments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType: "work_order" }), // Missing other fields
    }) as unknown as import("next/server").NextRequest;
    Object.defineProperty(request, "nextUrl", {
      value: new URL("http://localhost/api/attachments"),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("creates attachment and returns presigned URL", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({
      success: true,
      remaining: 9,
      reset: Date.now() + 60000,
    });
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: 2,
      departmentId: 1,
      isActive: true,
      employeeId: "TECH-001",
      hourlyRate: 25.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const mockAttachment = {
      id: 1,
      entityType: "work_order" as const,
      entityId: 1,
      type: "photo" as const,
      filename: "image.jpg",
      s3Key: "work_orders/1/image.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 1024,
      uploadedById: 1,
      createdAt: new Date(),
    };
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([mockAttachment]),
      })),
    } as unknown as ReturnType<typeof db.insert>);

    const request = new Request("http://localhost/api/attachments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: "work_order",
        entityId: 1,
        attachmentType: "photo",
        filename: "image.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      }),
    }) as unknown as import("next/server").NextRequest;
    Object.defineProperty(request, "nextUrl", {
      value: new URL("http://localhost/api/attachments"),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.attachment).toBeDefined();
    expect(data.data.uploadUrl).toBe("https://s3.example.com/presigned-upload");
  });
});

describe("GET /api/attachments/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new Request(
      "http://localhost/api/attachments/1"
    ) as unknown as import("next/server").NextRequest;

    const response = await GET_BY_ID(request, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid attachment ID", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: 2,
      departmentId: 1,
      isActive: true,
      employeeId: "TECH-001",
      hourlyRate: 25.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const request = new Request(
      "http://localhost/api/attachments/abc"
    ) as unknown as import("next/server").NextRequest;

    const response = await GET_BY_ID(request, {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 404 when attachment not found", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: 2,
      departmentId: 1,
      isActive: true,
      employeeId: "TECH-001",
      hourlyRate: 25.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(db.query.attachments.findFirst).mockResolvedValue(undefined);

    const request = new Request(
      "http://localhost/api/attachments/999"
    ) as unknown as import("next/server").NextRequest;

    const response = await GET_BY_ID(request, {
      params: Promise.resolve({ id: "999" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns attachment with download URL", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: 2,
      departmentId: 1,
      isActive: true,
      employeeId: "TECH-001",
      hourlyRate: 25.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const mockAttachment = {
      id: 1,
      entityType: "work_order" as const,
      entityId: 1,
      type: "document" as const,
      filename: "report.pdf",
      s3Key: "work_orders/1/1.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      uploadedById: 1,
      createdAt: new Date(),
    };
    vi.mocked(db.query.attachments.findFirst).mockResolvedValue(mockAttachment);

    const request = new Request(
      "http://localhost/api/attachments/1"
    ) as unknown as import("next/server").NextRequest;

    const response = await GET_BY_ID(request, {
      params: Promise.resolve({ id: "1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.attachment.filename).toBe("report.pdf");
    expect(data.data.downloadUrl).toBe(
      "https://s3.example.com/presigned-download"
    );
  });
});

describe("DELETE /api/attachments/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new Request("http://localhost/api/attachments/1", {
      method: "DELETE",
    }) as unknown as import("next/server").NextRequest;

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when attachment not found", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: 2,
      departmentId: 1,
      isActive: true,
      employeeId: "TECH-001",
      hourlyRate: 25.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(db.query.attachments.findFirst).mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/attachments/999", {
      method: "DELETE",
    }) as unknown as import("next/server").NextRequest;

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "999" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 403 when user is not owner and not admin", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 2, // Different user
      employeeId: "TECH-002",
      name: "Other Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });
    vi.mocked(db.query.attachments.findFirst).mockResolvedValue({
      id: 1,
      entityType: "work_order" as const,
      entityId: 1,
      type: "document" as const,
      filename: "report.pdf",
      s3Key: "work_orders/1/1.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      uploadedById: 1, // Owned by user 1
      createdAt: new Date(),
    });

    const request = new Request("http://localhost/api/attachments/1", {
      method: "DELETE",
    }) as unknown as import("next/server").NextRequest;

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(403);
  });

  it("deletes attachment when user is owner", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: 2,
      departmentId: 1,
      isActive: true,
      employeeId: "TECH-001",
      hourlyRate: 25.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(db.query.attachments.findFirst).mockResolvedValue({
      id: 1,
      entityType: "work_order" as const,
      entityId: 1,
      type: "document" as const,
      filename: "report.pdf",
      s3Key: "work_orders/1/1.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      uploadedById: 1, // Same user
      createdAt: new Date(),
    });
    vi.mocked(db.delete).mockReturnValue({
      where: vi.fn(),
    } as unknown as ReturnType<typeof db.delete>);

    const request = new Request("http://localhost/api/attachments/1", {
      method: "DELETE",
    }) as unknown as import("next/server").NextRequest;

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.success).toBe(true);
    expect(deleteObject).toHaveBeenCalled();
  });

  it("deletes attachment when user is admin", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 2,
      name: "Admin",
      email: "admin@example.com",
      pin: "hashed",
      roleId: 3,
      departmentId: 1,
      isActive: true,
      employeeId: "ADMIN-001",
      hourlyRate: 50.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(db.query.attachments.findFirst).mockResolvedValue({
      id: 1,
      entityType: "work_order" as const,
      entityId: 1,
      type: "document" as const,
      filename: "report.pdf",
      s3Key: "work_orders/1/1.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      uploadedById: 1, // Different user
      createdAt: new Date(),
    });
    vi.mocked(db.delete).mockReturnValue({
      where: vi.fn(),
    } as unknown as ReturnType<typeof db.delete>);

    const request = new Request("http://localhost/api/attachments/1", {
      method: "DELETE",
    }) as unknown as import("next/server").NextRequest;

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.success).toBe(true);
  });
});
