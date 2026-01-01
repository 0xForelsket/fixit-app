import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock S3
vi.mock("@/lib/s3", () => ({
  getPresignedUploadUrl: vi.fn(),
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

import { POST } from "@/app/(app)/api/attachments/presigned-url/route";
import { getPresignedUploadUrl } from "@/lib/s3";
import { getCurrentUser } from "@/lib/session";

describe("POST /api/attachments/presigned-url", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

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
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "1", displayId: 1,
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
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    vi.mocked(getPresignedUploadUrl).mockResolvedValue(
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
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    vi.mocked(getPresignedUploadUrl).mockResolvedValue(
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
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    vi.mocked(getPresignedUploadUrl).mockRejectedValue(
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
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    vi.mocked(getPresignedUploadUrl).mockResolvedValue(
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
