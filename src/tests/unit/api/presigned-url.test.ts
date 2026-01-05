import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mocks
const mockGetCurrentUser = vi.fn();
const mockGetPresignedUploadUrl = vi.fn();

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

// Mock S3
vi.mock("@/lib/s3", () => ({
  getPresignedUploadUrl: mockGetPresignedUploadUrl,
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

const { POST } = await import(
  "@/app/(app)/api/attachments/presigned-url/route"
);

describe("POST /api/attachments/presigned-url", () => {
  beforeEach(() => {
    mockGetCurrentUser.mockClear();
    mockGetPresignedUploadUrl.mockClear();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request(
      "http://localhost/api/attachments/presigned-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "photo.jpg",
          mimeType: "image/jpeg",
          entityType: "work_order",
          entityId: "1",
        }),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 when missing required fields", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const request = new Request(
      "http://localhost/api/attachments/presigned-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "photo.jpg",
          // Missing mimeType, entityType, entityId
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request data");
  });

  it("returns presigned URL and s3Key on success", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    mockGetPresignedUploadUrl.mockResolvedValue(
      "https://s3.example.com/upload?signed=true"
    );

    const request = new Request(
      "http://localhost/api/attachments/presigned-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "photo.jpg",
          mimeType: "image/jpeg",
          entityType: "work_order",
          entityId: "5",
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.uploadUrl).toBe("https://s3.example.com/upload?signed=true");
    expect(data.s3Key).toContain("work_orders/5/");
    expect(data.s3Key).toContain(".jpg");
  });

  it("generates correct s3Key format for different entity types", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    mockGetPresignedUploadUrl.mockResolvedValue(
      "https://s3.example.com/upload"
    );

    const request = new Request(
      "http://localhost/api/attachments/presigned-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "manual.pdf",
          mimeType: "application/pdf",
          entityType: "equipment",
          entityId: "10",
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(data.s3Key).toContain("equipments/10/");
    expect(data.s3Key).toContain(".pdf");
  });

  it("handles S3 errors gracefully", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    mockGetPresignedUploadUrl.mockRejectedValue(
      new Error("S3 bucket not accessible")
    );

    const request = new Request(
      "http://localhost/api/attachments/presigned-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "photo.jpg",
          mimeType: "image/jpeg",
          entityType: "work_order",
          entityId: "1",
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).not.toContain("S3 bucket");
  });

  it("preserves file extension from filename", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    mockGetPresignedUploadUrl.mockResolvedValue(
      "https://s3.example.com/upload"
    );

    const request = new Request(
      "http://localhost/api/attachments/presigned-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "document.with.dots.png",
          mimeType: "image/png",
          entityType: "work_order",
          entityId: "1",
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(data.s3Key).toMatch(/\.png$/);
  });
});
