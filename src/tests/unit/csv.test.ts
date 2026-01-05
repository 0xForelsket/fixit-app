import {
  autoDetectMapping,
  generateCSV,
  mapCSVToObjects,
  parseCSV,
  validateCSVFile,
} from "@/lib/csv";
import { describe, expect, it } from "vitest";

describe("csv utilities", () => {
  describe("parseCSV", () => {
    it("should parse simple CSV content", () => {
      const content =
        "name,email,age\nJohn,john@test.com,30\nJane,jane@test.com,25";
      const result = parseCSV(content);

      expect(result.headers).toEqual(["name", "email", "age"]);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual(["John", "john@test.com", "30"]);
      expect(result.rows[1]).toEqual(["Jane", "jane@test.com", "25"]);
    });

    it("should handle quoted fields", () => {
      const content = 'name,description\nWidget,"A nice, fancy widget"';
      const result = parseCSV(content);

      expect(result.rows[0][1]).toBe("A nice, fancy widget");
    });

    it("should handle escaped quotes in quoted fields", () => {
      const content = 'name,description\nTest,"He said ""hello"""';
      const result = parseCSV(content);

      expect(result.rows[0][1]).toBe('He said "hello"');
    });

    it("should skip empty lines by default", () => {
      const content = "name,value\n\nJohn,100\n\nJane,200\n";
      const result = parseCSV(content);

      expect(result.rows).toHaveLength(2);
    });

    it("should handle Windows line endings", () => {
      const content = "name,value\r\nJohn,100\r\nJane,200";
      const result = parseCSV(content);

      expect(result.rows).toHaveLength(2);
    });

    it("should use custom delimiter", () => {
      const content = "name;value\nJohn;100";
      const result = parseCSV(content, { delimiter: ";" });

      expect(result.rows[0]).toEqual(["John", "100"]);
    });

    it("should trim header whitespace", () => {
      const content = "  name  ,  value  \nJohn,100";
      const result = parseCSV(content);

      expect(result.headers).toEqual(["name", "value"]);
    });

    it("should handle empty CSV", () => {
      const content = "";
      const result = parseCSV(content);

      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    it("should handle header-only CSV", () => {
      const content = "name,email,age";
      const result = parseCSV(content);

      expect(result.headers).toEqual(["name", "email", "age"]);
      expect(result.rows).toEqual([]);
    });
  });

  describe("mapCSVToObjects", () => {
    it("should map rows to objects using column mapping", () => {
      const rows = [
        ["John", "john@test.com"],
        ["Jane", "jane@test.com"],
      ];
      const headers = ["name", "email"];
      const mapping = [
        { csvHeader: "name", field: "fullName" },
        { csvHeader: "email", field: "emailAddress" },
      ];

      const result = mapCSVToObjects<{
        fullName: string;
        emailAddress: string;
      }>(rows, headers, mapping);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        fullName: "John",
        emailAddress: "john@test.com",
      });
      expect(result.errors).toHaveLength(0);
    });

    it("should report error for missing required columns", () => {
      const rows = [["John"]];
      const headers = ["name"];
      const mapping = [
        { csvHeader: "name", field: "name" },
        { csvHeader: "email", field: "email", required: true },
      ];

      const result = mapCSVToObjects(rows, headers, mapping);

      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("email");
      expect(result.errors[0].message).toContain("not found");
    });

    it("should report error for empty required fields", () => {
      const rows = [["John", ""]];
      const headers = ["name", "email"];
      const mapping = [
        { csvHeader: "name", field: "name", required: true },
        { csvHeader: "email", field: "email", required: true },
      ];

      const result = mapCSVToObjects(rows, headers, mapping);

      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("email");
      expect(result.errors[0].message).toContain("empty");
    });

    it("should apply transform function", () => {
      const rows = [["100", "200"]];
      const headers = ["price", "quantity"];
      const mapping = [
        {
          csvHeader: "price",
          field: "price",
          transform: (v: string) => Number.parseFloat(v),
        },
        {
          csvHeader: "quantity",
          field: "quantity",
          transform: (v: string) => Number.parseInt(v, 10),
        },
      ];

      const result = mapCSVToObjects<{ price: number; quantity: number }>(
        rows,
        headers,
        mapping
      );

      expect(result.data[0].price).toBe(100);
      expect(result.data[0].quantity).toBe(200);
    });

    it("should handle transform errors", () => {
      const rows = [["not-a-number"]];
      const headers = ["value"];
      const mapping = [
        {
          csvHeader: "value",
          field: "value",
          transform: (v: string) => {
            const n = Number.parseFloat(v);
            if (Number.isNaN(n)) throw new Error("Invalid number");
            return n;
          },
        },
      ];

      const result = mapCSVToObjects(rows, headers, mapping);

      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe("Invalid number");
    });

    it("should handle case-insensitive header matching", () => {
      const rows = [["John"]];
      const headers = ["NAME"];
      const mapping = [{ csvHeader: "name", field: "name" }];

      const result = mapCSVToObjects<{ name: string }>(rows, headers, mapping);

      expect(result.data[0].name).toBe("John");
    });

    it("should return correct row numbers in errors", () => {
      const rows = [
        ["John", "valid@email.com"],
        ["Jane", ""],
      ];
      const headers = ["name", "email"];
      const mapping = [
        { csvHeader: "name", field: "name" },
        { csvHeader: "email", field: "email", required: true },
      ];

      const result = mapCSVToObjects(rows, headers, mapping);

      expect(result.errors[0].row).toBe(3); // Row 3 (1-indexed + header row)
    });
  });

  describe("autoDetectMapping", () => {
    it("should detect exact matches", () => {
      const headers = ["name", "email", "phone"];
      const definitions = [
        { field: "name", aliases: [] },
        { field: "email", aliases: [] },
      ];

      const mapping = autoDetectMapping(headers, definitions);

      expect(mapping).toHaveLength(2);
      expect(mapping[0]).toEqual({
        csvHeader: "name",
        field: "name",
        required: undefined,
      });
      expect(mapping[1]).toEqual({
        csvHeader: "email",
        field: "email",
        required: undefined,
      });
    });

    it("should detect alias matches", () => {
      const headers = ["Full Name", "E-mail Address"];
      const definitions = [
        { field: "name", aliases: ["full name", "fullname"] },
        {
          field: "email",
          aliases: ["e-mail", "e-mail address", "email address"],
        },
      ];

      const mapping = autoDetectMapping(headers, definitions);

      expect(mapping[0].csvHeader).toBe("Full Name");
      expect(mapping[0].field).toBe("name");
      expect(mapping[1].csvHeader).toBe("E-mail Address");
      expect(mapping[1].field).toBe("email");
    });

    it("should mark required fields", () => {
      const headers = ["name"];
      const definitions = [{ field: "name", aliases: [], required: true }];

      const mapping = autoDetectMapping(headers, definitions);

      expect(mapping[0].required).toBe(true);
    });

    it("should include missing required fields for error reporting", () => {
      const headers = ["name"];
      const definitions = [
        { field: "name", aliases: [] },
        { field: "email", aliases: [], required: true },
      ];

      const mapping = autoDetectMapping(headers, definitions);

      expect(mapping).toHaveLength(2);
      expect(mapping[1].csvHeader).toBe("email");
      expect(mapping[1].required).toBe(true);
    });
  });

  describe("generateCSV", () => {
    it("should generate CSV from objects", () => {
      const data = [
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ];
      const columns = [
        { field: "name" as const, header: "Name" },
        { field: "age" as const, header: "Age" },
      ];

      const csv = generateCSV(data, columns);
      const lines = csv.split("\n");

      expect(lines[0]).toBe("Name,Age");
      expect(lines[1]).toBe("John,30");
      expect(lines[2]).toBe("Jane,25");
    });

    it("should quote fields containing commas", () => {
      const data = [{ name: "Doe, John" }];
      const columns = [{ field: "name" as const, header: "Name" }];

      const csv = generateCSV(data, columns);

      expect(csv).toContain('"Doe, John"');
    });

    it("should escape quotes in fields", () => {
      const data = [{ quote: 'He said "hello"' }];
      const columns = [{ field: "quote" as const, header: "Quote" }];

      const csv = generateCSV(data, columns);

      expect(csv).toContain('"He said ""hello"""');
    });

    it("should handle null and undefined values", () => {
      const data = [{ name: null, email: undefined }];
      const columns = [
        { field: "name" as const, header: "Name" },
        { field: "email" as const, header: "Email" },
      ];

      const csv = generateCSV(data as Record<string, unknown>[], columns);
      const lines = csv.split("\n");

      expect(lines[1]).toBe(",");
    });

    it("should quote fields containing newlines", () => {
      const data = [{ description: "Line 1\nLine 2" }];
      const columns = [
        { field: "description" as const, header: "Description" },
      ];

      const csv = generateCSV(data, columns);

      expect(csv).toContain('"Line 1\nLine 2"');
    });
  });

  describe("validateCSVFile", () => {
    it("should accept valid CSV files", () => {
      const file = new File(["content"], "data.csv", { type: "text/csv" });

      expect(validateCSVFile(file)).toBeNull();
    });

    it("should accept text/plain with .csv extension", () => {
      const file = new File(["content"], "data.csv", { type: "text/plain" });

      expect(validateCSVFile(file)).toBeNull();
    });

    it("should accept .txt extension", () => {
      const file = new File(["content"], "data.txt", { type: "text/plain" });

      expect(validateCSVFile(file)).toBeNull();
    });

    it("should reject non-CSV files", () => {
      const file = new File(["content"], "image.png", { type: "image/png" });

      expect(validateCSVFile(file)).toBe("File must be a CSV file");
    });

    it("should reject files over 10MB", () => {
      // Create a file object with size > 10MB
      const largeContent = "x".repeat(11 * 1024 * 1024);
      const file = new File([largeContent], "large.csv", { type: "text/csv" });

      expect(validateCSVFile(file)).toBe("File size must be less than 10MB");
    });
  });
});
