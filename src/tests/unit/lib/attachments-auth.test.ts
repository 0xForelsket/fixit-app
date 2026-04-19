import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockWorkOrdersFindFirst,
  mockEquipmentFindFirst,
  mockUsersFindFirst,
  mockLocationsFindFirst,
  mockVendorsFindFirst,
  mockSparePartsFindFirst,
  mockAttachmentsFindFirst,
} = vi.hoisted(() => ({
  mockWorkOrdersFindFirst: vi.fn(),
  mockEquipmentFindFirst: vi.fn(),
  mockUsersFindFirst: vi.fn(),
  mockLocationsFindFirst: vi.fn(),
  mockVendorsFindFirst: vi.fn(),
  mockSparePartsFindFirst: vi.fn(),
  mockAttachmentsFindFirst: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    query: {
      workOrders: {
        findFirst: mockWorkOrdersFindFirst,
      },
      equipment: {
        findFirst: mockEquipmentFindFirst,
      },
      users: {
        findFirst: mockUsersFindFirst,
      },
      locations: {
        findFirst: mockLocationsFindFirst,
      },
      vendors: {
        findFirst: mockVendorsFindFirst,
      },
      spareParts: {
        findFirst: mockSparePartsFindFirst,
      },
      attachments: {
        findFirst: mockAttachmentsFindFirst,
      },
    },
  },
}));

vi.mock("@/lib/auth", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/permissions")>(
      "@/lib/permissions"
    );

  return {
    PERMISSIONS: actual.PERMISSIONS,
    userHasPermission: vi.fn(
      (user: { permissions: string[] }, permission: string) => {
        return (
          user.permissions.includes(actual.PERMISSIONS.ALL) ||
          user.permissions.includes(permission)
        );
      }
    ),
  };
});

const { authorizeAttachmentAccessById, authorizeAttachmentEntityAccess } =
  await import("@/lib/attachments-auth");

describe("attachments-auth", () => {
  beforeEach(() => {
    mockWorkOrdersFindFirst.mockReset();
    mockEquipmentFindFirst.mockReset();
    mockUsersFindFirst.mockReset();
    mockLocationsFindFirst.mockReset();
    mockVendorsFindFirst.mockReset();
    mockSparePartsFindFirst.mockReset();
    mockAttachmentsFindFirst.mockReset();
  });

  it("allows a reporter to view their own work-order attachments", async () => {
    mockWorkOrdersFindFirst.mockResolvedValue({
      id: "wo-1",
      reportedById: "user-1",
      assignedToId: null,
    });

    const result = await authorizeAttachmentEntityAccess({
      user: {
        id: "user-1",
        displayId: 1,
        employeeId: "OP-001",
        name: "Operator",
        roleName: "operator",
        permissions: ["ticket:view"],
        sessionVersion: 1,
      },
      entityType: "work_order",
      entityId: "wo-1",
      action: "view",
    });

    expect(result).toMatchObject({
      allowed: true,
      exists: true,
      entityType: "work_order",
      entityId: "wo-1",
    });
  });

  it("denies work-order attachment reads when the user cannot see that work order", async () => {
    mockWorkOrdersFindFirst.mockResolvedValue({
      id: "wo-1",
      reportedById: "user-2",
      assignedToId: null,
    });

    const result = await authorizeAttachmentEntityAccess({
      user: {
        id: "user-1",
        displayId: 1,
        employeeId: "OP-001",
        name: "Operator",
        roleName: "operator",
        permissions: ["ticket:view"],
        sessionVersion: 1,
      },
      entityType: "work_order",
      entityId: "wo-1",
      action: "view",
    });

    expect(result.allowed).toBe(false);
    expect(result.exists).toBe(true);
  });

  it("requires equipment:update to upload equipment attachments", async () => {
    mockEquipmentFindFirst.mockResolvedValue({
      id: "eq-1",
    });

    const result = await authorizeAttachmentEntityAccess({
      user: {
        id: "user-1",
        displayId: 1,
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        permissions: ["equipment:view"],
        sessionVersion: 1,
      },
      entityType: "equipment",
      entityId: "eq-1",
      action: "upload",
    });

    expect(result.allowed).toBe(false);
    expect(result.exists).toBe(true);
  });

  it("allows users to upload their own avatar attachments", async () => {
    mockUsersFindFirst.mockResolvedValue({
      id: "user-1",
    });

    const result = await authorizeAttachmentEntityAccess({
      user: {
        id: "user-1",
        displayId: 1,
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        permissions: [],
        sessionVersion: 1,
      },
      entityType: "user",
      entityId: "user-1",
      action: "upload",
    });

    expect(result.allowed).toBe(true);
    expect(result.exists).toBe(true);
  });

  it("maps delete checks through the attachment parent entity type", async () => {
    mockAttachmentsFindFirst.mockResolvedValue({
      id: "att-1",
      entityType: "spare_part",
      entityId: "part-1",
      uploadedById: "user-2",
      s3Key: "spare_parts/part-1/att-1.pdf",
      filename: "spec.pdf",
      mimeType: "application/pdf",
      sizeBytes: 100,
      type: "document",
      createdAt: new Date(),
    });
    mockSparePartsFindFirst.mockResolvedValue({
      id: "part-1",
    });

    const result = await authorizeAttachmentAccessById({
      user: {
        id: "user-1",
        displayId: 1,
        employeeId: "INV-001",
        name: "Inventory",
        roleName: "admin",
        permissions: ["inventory:view", "inventory:update"],
        sessionVersion: 1,
      },
      attachmentId: "att-1",
      action: "delete",
    });

    expect(result.allowed).toBe(true);
    expect(result.attachment?.entityType).toBe("spare_part");
  });
});
