/**
 * CSV Parser Utility
 *
 * Lightweight CSV parsing with column mapping support.
 * No external dependencies.
 */

export interface ParseResult<T> {
  data: T[];
  errors: ParseError[];
  headers: string[];
}

export interface ParseError {
  row: number;
  column?: string;
  message: string;
  value?: string;
}

export interface ColumnMapping {
  csvHeader: string;
  field: string;
  required?: boolean;
  transform?: (value: string) => unknown;
}

/**
 * Parse CSV string into array of objects
 */
export function parseCSV(
  content: string,
  options: {
    delimiter?: string;
    skipEmptyLines?: boolean;
  } = {}
): { rows: string[][]; headers: string[] } {
  const { delimiter = ",", skipEmptyLines = true } = options;

  const lines = content.split(/\r?\n/);
  const rows: string[][] = [];

  for (const line of lines) {
    if (skipEmptyLines && line.trim() === "") continue;

    const row = parseCSVLine(line, delimiter);
    rows.push(row);
  }

  const headers = rows.length > 0 ? rows[0].map((h) => h.trim()) : [];
  const dataRows = rows.slice(1);

  return { rows: dataRows, headers };
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === delimiter) {
        // Field separator
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  // Push last field
  result.push(current.trim());

  return result;
}

/**
 * Map CSV rows to typed objects using column mapping
 */
export function mapCSVToObjects<T>(
  rows: string[][],
  headers: string[],
  mapping: ColumnMapping[]
): ParseResult<T> {
  const data: T[] = [];
  const errors: ParseError[] = [];

  // Create header index map
  const headerIndex = new Map<string, number>();
  headers.forEach((h, i) => headerIndex.set(h.toLowerCase(), i));

  // Validate required columns exist
  for (const col of mapping) {
    if (col.required) {
      const idx = headerIndex.get(col.csvHeader.toLowerCase());
      if (idx === undefined) {
        errors.push({
          row: 0,
          column: col.csvHeader,
          message: `Required column "${col.csvHeader}" not found in CSV`,
        });
      }
    }
  }

  if (errors.length > 0) {
    return { data: [], errors, headers };
  }

  // Process each row
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const obj: Record<string, unknown> = {};
    let rowHasError = false;

    for (const col of mapping) {
      const idx = headerIndex.get(col.csvHeader.toLowerCase());
      let value: string | undefined;

      if (idx !== undefined && idx < row.length) {
        value = row[idx];
      }

      // Check required
      if (col.required && (!value || value.trim() === "")) {
        errors.push({
          row: rowIdx + 2, // +2 for 1-indexed and header row
          column: col.csvHeader,
          message: `Required field "${col.csvHeader}" is empty`,
          value,
        });
        rowHasError = true;
        continue;
      }

      // Transform value
      if (value !== undefined && value.trim() !== "") {
        try {
          obj[col.field] = col.transform
            ? col.transform(value.trim())
            : value.trim();
        } catch (err) {
          errors.push({
            row: rowIdx + 2,
            column: col.csvHeader,
            message:
              err instanceof Error
                ? err.message
                : `Invalid value for "${col.csvHeader}"`,
            value,
          });
          rowHasError = true;
        }
      } else if (!col.required) {
        obj[col.field] = undefined;
      }
    }

    if (!rowHasError) {
      data.push(obj as T);
    }
  }

  return { data, errors, headers };
}

/**
 * Auto-detect column mapping based on header names
 */
export function autoDetectMapping(
  headers: string[],
  fieldDefinitions: { field: string; aliases: string[]; required?: boolean }[]
): ColumnMapping[] {
  const mapping: ColumnMapping[] = [];
  const usedHeaders = new Set<string>();

  for (const def of fieldDefinitions) {
    // Find matching header
    const allNames = [def.field, ...def.aliases].map((n) => n.toLowerCase());
    const matchedHeader = headers.find(
      (h) => allNames.includes(h.toLowerCase()) && !usedHeaders.has(h)
    );

    if (matchedHeader) {
      usedHeaders.add(matchedHeader);
      mapping.push({
        csvHeader: matchedHeader,
        field: def.field,
        required: def.required,
      });
    } else if (def.required) {
      // Required field not found - will be caught during mapping
      mapping.push({
        csvHeader: def.field,
        field: def.field,
        required: true,
      });
    }
  }

  return mapping;
}

/**
 * Generate CSV string from objects
 */
export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { field: keyof T; header: string }[]
): string {
  const headers = columns.map((c) => c.header);
  const rows = data.map((item) =>
    columns.map((c) => {
      const value = item[c.field];
      if (value === null || value === undefined) return "";
      const str = String(value);
      // Quote if contains delimiter, newline, or quotes
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
  );

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Validate file is a CSV
 */
export function validateCSVFile(file: File): string | null {
  const validTypes = ["text/csv", "application/csv", "text/plain"];
  const validExtensions = [".csv", ".txt"];

  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

  if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
    return "File must be a CSV file";
  }

  // 10MB limit
  if (file.size > 10 * 1024 * 1024) {
    return "File size must be less than 10MB";
  }

  return null;
}
