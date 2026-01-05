import { getReportTemplate, saveReportTemplate } from "@/actions/reports";
import { db } from "@/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the DB and schema
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
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

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock schema imports - this is tricky with Drizzle but for actions we mostly just need the object refs
vi.mock("@/db/schema", () => ({
  reportTemplates: { id: "reportTemplates" },
  reportSchedules: {},
}));

vi.mock("drizzle-orm", () => ({
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
        createdById: "user123",
      };

      // Ensure mock chaining works
      const mockValues = vi.fn().mockResolvedValue(undefined);
      (db.insert as any).mockReturnValue({ values: mockValues });

      await saveReportTemplate(mockData);

      expect(db.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Report",
          createdById: "user123",
        })
      );
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
        createdById: "user123",
      };

      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      (db.update as any).mockReturnValue({ set: mockSet });

      await saveReportTemplate(mockData);

      expect(db.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Updated Report",
        })
      );
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe("getReportTemplate", () => {
    it("should fetch a template by ID", async () => {
      const mockTemplate = { id: "123", name: "Test" };
      (db.query.reportTemplates.findFirst as any).mockResolvedValue(
        mockTemplate
      );

      const result = await getReportTemplate("123");
      expect(result).toEqual(mockTemplate);
    });
  });
});
