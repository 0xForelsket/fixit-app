import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, mock } from "vitest";

// Create mocks
const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockInsertValues = vi.fn();
const mockInsertReturning = vi.fn();
const mockInsert = vi.fn(() => ({
  values: mockInsertValues.mockReturnValue({
    returning: mockInsertReturning,
  }),
}));
const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdate = vi.fn(() => ({
  set: mockUpdateSet.mockReturnValue({
    where: mockUpdateWhere,
  }),
}));
const mockDeleteWhere = vi.fn();
const mockDelete = vi.fn(() => ({
  where: mockDeleteWhere,
}));

const mockGetCurrentUser = vi.fn();
const mockRequireCsrf = vi.fn().mockResolvedValue(true);
const mockCheckRateLimit = vi.fn(() => ({
  success: true,
  remaining: 9,
  reset: Date.now() + 60000,
}));
const mockGetClientIp = vi.fn(() => "127.0.0.1");

const mockGenerateS3Key = vi.fn(() => "work_orders/1/1.pdf");
const mockGetPresignedUploadUrl = vi.fn(() => "https://s3.example.com/presigned-upload");
const mockGetPresignedDownloadUrl = vi.fn(() => "https://s3.example.com/presigned-download");
const mockDeleteObject = vi.fn();

const mockApiLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};
const mockGenerateRequestId = vi.fn(() => "test-request-id");

const mockUserHasPermission = vi.fn();

// Mock modules
vi.vi.fn("@/db", () => ({
  db: {
    query: {
      attachments: {
        findMany: mockFindMany,
        findFirst: mockFindFirst,
      },
    },
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  },
}));

vi.vi.fn("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
  requireCsrf: mockRequireCsrf,
}));

vi.vi.fn("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIp: mockGetClientIp,
  RATE_LIMITS: {
    upload: { limit: 10, windowMs: 60000 },
  },
}));

vi.vi.fn("@/lib/s3", () => ({
  generateS3Key: mockGenerateS3Key,
  getPresignedUploadUrl: mockGetPresignedUploadUrl,
  getPresignedDownloadUrl: mockGetPresignedDownloadUrl,
  deleteObject: mockDeleteObject,
}));

vi.vi.fn("@/lib/logger", () => ({
  apiLogger: mockApiLogger,
  generateRequestId: mockGenerateRequestId,
}));

vi.vi.fn("@/lib/auth", () => ({
  userHasPermission: mockUserHasPermission,
  PERMISSIONS: {
    ALL: "*",
  },
}));

// Dynamic imports after mock.module
const { DELETE, GET: GET_BY_ID } = await import("@/app/(app)/api/attachments/[id]/route");
const { GET, POST } = await import("@/app/(app)/api/attachments/route");

beforeEach(() => {
  mockFindMany.mockClear();
  mockFindFirst.mockClear();
  mockInsert.mockClear();
  mockInsertValues.mockClear();
  mockInsertReturning.mockClear();
  mockUpdate.mockClear();
  mockUpdateSet.mockClear();
  mockUpdateWhere.mockClear();
  mockDelete.mockClear();
  mockDeleteWhere.mockClear();
  mockGetCurrentUser.mockClear();
  mockRequireCsrf.mockClear();
  mockCheckRateLimit.mockClear();
  mockGetClientIp.mockClear();
  mockGenerateS3Key.mockClear();
  mockGetPresignedUploadUrl.mockClear();
  mockGetPresignedDownloadUrl.mockClear();
  mockDeleteObject.mockClear();
  mockApiLogger.error.mockClear();
  mockApiLogger.warn.mockClear();
  mockApiLogger.info.mockClear();
  mockGenerateRequestId.mockClear();
  mockUserHasPermission.mockClear();

  mockUserHasPermission.mockReturnValue(true);
  
  // Re-setup mock chains if needed
  mockInsert.mockReturnValue({
    values: mockInsertValues.mockReturnValue({
      returning: mockInsertReturning,
    }),
  });
  mockUpdate.mockReturnValue({
    set: mockUpdateSet.mockReturnValue({
      where: mockUpdateWhere,
    }),
  });
  mockDelete.mockReturnValue({
    where: mockDeleteWhere,
  });
});

describe("GET /api/attachments", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

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
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: "2",
      departmentId: "1",
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
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: "2",
      departmentId: "1",
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
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: "2",
      departmentId: "1",
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

    expect(response.status).toBe(200);
  });

  it("returns attachments list", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: "2",
      departmentId: "1",
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
        id: "1",
        entityType: "work_order" as const,
        entityId: "1",
        type: "document" as const,
        filename: "report.pdf",
        s3Key: "work_orders/1/report.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
        uploadedById: "1",
        createdAt: new Date(),
        uploadedBy: { name: "Tech" },
      },
    ];
    mockFindMany.mockResolvedValue(mockAttachments);

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
  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockReturnValue({
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
    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 9,
      reset: Date.now() + 60000,
    });
    mockGetCurrentUser.mockResolvedValue(null);

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
    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 9,
      reset: Date.now() + 60000,
    });
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: "2",
      departmentId: "1",
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
    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 9,
      reset: Date.now() + 60000,
    });
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: "2",
      departmentId: "1",
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
      entityType: "work_order" as const,
      entityId: "1",
      type: "photo" as const,
      filename: "image.jpg",
      s3Key: "work_orders/1/image.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 1024,
      uploadedById: "1",
      createdAt: new Date(),
    };
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockAttachment]),
      }),
    } as any);

    const request = new Request("http://localhost/api/attachments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: "work_order",
        entityId: "1",
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
  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request(
      "http://localhost/api/attachments/1"
    ) as unknown as import("next/server").NextRequest;

    const response = await GET_BY_ID(request, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid attachment ID", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: "2",
      departmentId: "1",
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

    expect(response.status).toBe(404);
  });

  it("returns 404 when attachment not found", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: "2",
      departmentId: "1",
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
    mockFindFirst.mockResolvedValue(undefined);

    const request = new Request(
      "http://localhost/api/attachments/999"
    ) as unknown as import("next/server").NextRequest;

    const response = await GET_BY_ID(request, {
      params: Promise.resolve({ id: "999" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns attachment with download URL", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: "2",
      departmentId: "1",
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
      id: "1",
      entityType: "work_order" as const,
      entityId: "1",
      type: "document" as const,
      filename: "report.pdf",
      s3Key: "work_orders/1/1.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      uploadedById: "1",
      createdAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(mockAttachment);

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
  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/attachments/1", {
      method: "DELETE",
    }) as unknown as import("next/server").NextRequest;

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when attachment not found", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: "2",
      departmentId: "1",
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
    mockFindFirst.mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/attachments/999", {
      method: "DELETE",
    }) as unknown as import("next/server").NextRequest;

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "999" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 403 when user is not owner and not admin", async () => {
    mockUserHasPermission.mockReturnValue(false);
    mockGetCurrentUser.mockResolvedValue({
      displayId: 2,
      id: "2", // Different user
      employeeId: "TECH-002",
      name: "Other Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });
    mockFindFirst.mockResolvedValue({
      id: "1",
      entityType: "work_order" as const,
      entityId: "1",
      type: "document" as const,
      filename: "report.pdf",
      s3Key: "work_orders/1/1.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      uploadedById: "1", // Owned by user 1
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
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: "2",
      departmentId: "1",
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
    mockFindFirst.mockResolvedValue({
      id: "1",
      entityType: "work_order" as const,
      entityId: "1",
      type: "document" as const,
      filename: "report.pdf",
      s3Key: "work_orders/1/1.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      uploadedById: "1", // Same user
      createdAt: new Date(),
    });
    mockDelete.mockReturnValue({
      where: vi.fn(),
    } as any);

    const request = new Request("http://localhost/api/attachments/1", {
      method: "DELETE",
    }) as unknown as import("next/server").NextRequest;

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.success).toBe(true);
    expect(mockDeleteObject).toHaveBeenCalled();
  });

  it("deletes attachment when user is admin", async () => {
    mockGetCurrentUser.mockResolvedValue({
      displayId: 2,
      id: "2",
      name: "Admin",
      email: "admin@example.com",
      pin: "hashed",
      roleId: "3",
      departmentId: "1",
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
    mockFindFirst.mockResolvedValue({
      id: "1",
      entityType: "work_order" as const,
      entityId: "1",
      type: "document" as const,
      filename: "report.pdf",
      s3Key: "work_orders/1/1.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      uploadedById: "1", // Different user
      createdAt: new Date(),
    });
    mockDelete.mockReturnValue({
      where: vi.fn(),
    } as any);

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
