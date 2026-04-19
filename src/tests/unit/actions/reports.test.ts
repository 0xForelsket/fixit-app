import { getReportTemplate, saveReportTemplate } from "@/actions/reports";
import { db } from "@/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the DB and schema
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
    select: vi.fn(() => ({
      from: vi.fn(),
    })),
    query: {
      reportTemplates: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock("@/lib/session", () => ({
  requirePermission: vi.fn(async () => ({
    id: "user123",
    displayId: 1,
    employeeId: "ADMIN-001",
    name: "Admin User",
    roleName: "admin",
    permissions: ["*"],
    sessionVersion: 1,
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock schema imports - this is tricky with Drizzle but for actions we mostly just need the object refs
vi.mock("@/db/schema", () => ({
  reportTemplates: { id: "reportTemplates" },
  reportSchedules: {},
}));

vi.mock("drizzle-orm", () => ({
  desc: vi.fn(),
  eq: vi.fn(),
}));

describe("Actions: Reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveReportTemplate", () => {
    it("should insert a new template when no ID is provided", async () => {
      const mockData = {
        name: "Test Report",
        description: "A test report",
        config: {
          title: "Test Report",
          widgets: [],
        },
      };

      // Ensure mock chaining works
      const mockValues = vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([
          {
            id: "template123",
            name: "Test Report",
            description: "A test report",
            config: {
              title: "Test Report",
              widgets: [],
            },
            createdById: "user123",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      }));
      (db.insert as any).mockReturnValue({ values: mockValues });

      const result = await saveReportTemplate(mockData);

      expect(db.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Report",
          createdById: "user123",
        })
      );
      expect(result.success).toBe(true);
    });

    it("should update an existing template when ID is provided", async () => {
      const mockData = {
        id: "template123",
        name: "Updated Report",
        description: "Updated description",
        config: {
          title: "Updated Report",
          widgets: [],
        },
      };

      (db.query.reportTemplates.findFirst as any).mockResolvedValue({
        id: "template123",
        name: "Existing Report",
        description: "Existing description",
        config: {
          title: "Existing Report",
          widgets: [],
        },
        createdById: "user123",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockWhere = vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([
          {
            id: "template123",
            name: "Updated Report",
            description: "Updated description",
            config: {
              title: "Updated Report",
              widgets: [],
            },
            createdById: "user123",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      }));
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      (db.update as any).mockReturnValue({ set: mockSet });

      const result = await saveReportTemplate(mockData);

      expect(db.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Updated Report",
        })
      );
      expect(mockWhere).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe("getReportTemplate", () => {
    it("should fetch a template by ID", async () => {
      const mockTemplate = {
        id: "123",
        name: "Test",
        description: null,
        config: {
          title: "Test",
          widgets: [],
        },
        createdById: "user123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (db.query.reportTemplates.findFirst as any).mockResolvedValue(
        mockTemplate
      );

      const result = await getReportTemplate("123");
      expect(result).toEqual({ success: true, data: mockTemplate });
    });
  });
});
