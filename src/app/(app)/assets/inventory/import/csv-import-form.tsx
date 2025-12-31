"use client";

import {
  type PartImportResult,
  type PartImportRow,
  importPartsFromCSV,
} from "@/actions/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";

// Expected CSV headers (case-insensitive matching)
const EXPECTED_HEADERS = [
  "partNumber",
  "name",
  "description",
  "quantity",
  "minStock",
  "unitCost",
  "location",
  "manufacturer",
] as const;

// Alternative header names that map to our expected headers
const HEADER_ALIASES: Record<string, keyof PartImportRow> = {
  partnumber: "partNumber",
  "part number": "partNumber",
  part_number: "partNumber",
  sku: "partNumber",
  name: "name",
  "part name": "name",
  partname: "name",
  description: "description",
  desc: "description",
  quantity: "quantity",
  qty: "quantity",
  stock: "quantity",
  minstock: "minStock",
  "min stock": "minStock",
  min_stock: "minStock",
  reorderpoint: "minStock",
  "reorder point": "minStock",
  reorder_point: "minStock",
  unitcost: "unitCost",
  "unit cost": "unitCost",
  unit_cost: "unitCost",
  cost: "unitCost",
  price: "unitCost",
  location: "location",
  loc: "location",
  manufacturer: "manufacturer",
  mfg: "manufacturer",
  vendor: "manufacturer",
};

interface ParsedCSV {
  headers: string[];
  rows: PartImportRow[];
  rawRows: string[][];
  errors: string[];
}

function parseCSV(text: string): ParsedCSV {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  const errors: string[] = [];

  if (lines.length === 0) {
    return { headers: [], rows: [], rawRows: [], errors: ["File is empty"] };
  }

  // Parse header row
  const headerLine = lines[0];
  const rawHeaders = parseCSVLine(headerLine);

  // Map headers to our expected format
  const headerMapping: (keyof PartImportRow | null)[] = rawHeaders.map(
    (header) => {
      const normalized = header.toLowerCase().trim();
      return HEADER_ALIASES[normalized] || null;
    }
  );

  // Check for required headers
  const hasPartNumber = headerMapping.includes("partNumber");
  const hasName = headerMapping.includes("name");

  if (!hasPartNumber) {
    errors.push(
      'Missing required column: "partNumber" (or "sku", "part number")'
    );
  }
  if (!hasName) {
    errors.push('Missing required column: "name" (or "part name")');
  }

  if (errors.length > 0) {
    return { headers: rawHeaders, rows: [], rawRows: [], errors };
  }

  // Parse data rows
  const rows: PartImportRow[] = [];
  const rawRows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    rawRows.push(values);

    const row: Partial<PartImportRow> = {};

    for (let j = 0; j < values.length; j++) {
      const mappedHeader = headerMapping[j];
      if (mappedHeader && values[j] !== undefined) {
        const value = values[j].trim();

        if (
          mappedHeader === "quantity" ||
          mappedHeader === "minStock" ||
          mappedHeader === "unitCost"
        ) {
          // Parse numeric values
          if (value !== "") {
            const num = Number.parseFloat(value.replace(/[$,]/g, ""));
            if (!Number.isNaN(num)) {
              row[mappedHeader] = num;
            }
          }
        } else {
          row[mappedHeader] = value;
        }
      }
    }

    rows.push(row as PartImportRow);
  }

  return { headers: rawHeaders, rows, rawRows, errors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

export function CSVImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<PartImportResult | null>(
    null
  );
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setParsedData(parsed);
    };
    reader.readAsText(selectedFile);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files?.[0]) {
        const droppedFile = e.dataTransfer.files[0];
        if (
          droppedFile.type === "text/csv" ||
          droppedFile.name.endsWith(".csv")
        ) {
          handleFile(droppedFile);
        }
      }
    },
    [handleFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const handleImport = async () => {
    if (!parsedData || parsedData.rows.length === 0) return;

    setImporting(true);
    try {
      const result = await importPartsFromCSV(parsedData.rows);
      setImportResult(result);
    } catch (error) {
      setImportResult({
        success: false,
        totalRows: parsedData.rows.length,
        successCount: 0,
        failureCount: parsedData.rows.length,
        results: [],
        error: error instanceof Error ? error.message : "Import failed",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setImportResult(null);
  };

  const downloadTemplate = () => {
    const headers = EXPECTED_HEADERS.join(",");
    const exampleRow =
      "PART-001,Bearing 6205,Deep groove ball bearing,100,10,25.50,Main Warehouse,SKF";
    const csv = `${headers}\n${exampleRow}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "parts_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Show import results
  if (importResult) {
    return (
      <div className="space-y-6">
        {/* Result Summary */}
        <div
          className={cn(
            "rounded-2xl border-2 p-6",
            importResult.success
              ? "border-success-200 bg-success-50"
              : importResult.successCount > 0
                ? "border-warning-200 bg-warning-50"
                : "border-danger-200 bg-danger-50"
          )}
        >
          <div className="flex items-center gap-4 mb-4">
            {importResult.success ? (
              <div className="h-12 w-12 rounded-xl bg-success-500 text-white flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7" />
              </div>
            ) : importResult.successCount > 0 ? (
              <div className="h-12 w-12 rounded-xl bg-warning-500 text-white flex items-center justify-center">
                <AlertCircle className="h-7 w-7" />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-xl bg-danger-500 text-white flex items-center justify-center">
                <XCircle className="h-7 w-7" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">
                {importResult.success
                  ? "Import Complete"
                  : importResult.successCount > 0
                    ? "Partial Import"
                    : "Import Failed"}
              </h3>
              <p className="text-sm font-medium opacity-80">
                {importResult.successCount} of {importResult.totalRows} parts
                imported successfully
              </p>
            </div>
          </div>

          {importResult.error && (
            <p className="text-sm font-bold text-danger-700 mt-2">
              {importResult.error}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="rounded-xl bg-white/80 p-4 text-center border">
              <p className="text-2xl font-black">{importResult.totalRows}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Total Rows
              </p>
            </div>
            <div className="rounded-xl bg-white/80 p-4 text-center border">
              <p className="text-2xl font-black text-success-600">
                {importResult.successCount}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Successful
              </p>
            </div>
            <div className="rounded-xl bg-white/80 p-4 text-center border">
              <p className="text-2xl font-black text-danger-600">
                {importResult.failureCount}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Failed
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        {importResult.results.length > 0 && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 border-b">
              <h4 className="font-bold uppercase tracking-tight text-sm">
                Import Details
              </h4>
            </div>
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-[10px] uppercase tracking-widest font-black">
                    <TableHead className="w-16">Row</TableHead>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importResult.results.map((result) => (
                    <TableRow key={result.row}>
                      <TableCell className="font-mono font-bold">
                        {result.row}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {result.partNumber}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={result.success ? "success" : "danger"}
                          className="font-black text-[10px] uppercase"
                        >
                          {result.success ? "Success" : "Failed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {result.success ? (
                          <span className="text-muted-foreground">
                            Created with ID #{result.partId}
                          </span>
                        ) : (
                          <span className="text-danger-600 font-medium">
                            {result.error}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleReset} variant="outline" className="flex-1">
            <Upload className="mr-2 h-4 w-4" />
            Import Another File
          </Button>
          <Button asChild className="flex-1">
            <a href="/assets/inventory/parts">View Parts Catalog</a>
          </Button>
        </div>
      </div>
    );
  }

  // Show preview and import button
  if (parsedData) {
    const hasErrors = parsedData.errors.length > 0;
    const previewRows = parsedData.rawRows.slice(0, 10);

    return (
      <div className="space-y-6">
        {/* File Info */}
        <div className="flex items-center justify-between rounded-xl border bg-card p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold">{file?.name}</p>
              <p className="text-sm text-muted-foreground">
                {parsedData.rows.length} rows to import
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Errors */}
        {hasErrors && (
          <div className="rounded-xl border-2 border-danger-200 bg-danger-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-danger-600" />
              <span className="font-bold text-danger-900">
                CSV Validation Errors
              </span>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {parsedData.errors.map((error, idx) => (
                <li key={idx} className="text-sm text-danger-700">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Column Mapping Info */}
        {!hasErrors && (
          <div className="rounded-xl border bg-muted/50 p-4">
            <h4 className="font-bold text-sm mb-2">Detected Columns</h4>
            <div className="flex flex-wrap gap-2">
              {parsedData.headers.map((header, idx) => {
                const normalized = header.toLowerCase().trim();
                const mapped = HEADER_ALIASES[normalized];
                return (
                  <Badge
                    key={idx}
                    variant={mapped ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {header}
                    {mapped && mapped !== header.toLowerCase() && (
                      <span className="opacity-70 ml-1">({mapped})</span>
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Preview Table */}
        {!hasErrors && previewRows.length > 0 && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 border-b flex items-center justify-between">
              <h4 className="font-bold uppercase tracking-tight text-sm">
                Preview (First 10 Rows)
              </h4>
              <Badge variant="secondary" className="text-[10px] font-bold">
                {parsedData.rows.length} TOTAL
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-[10px] uppercase tracking-widest font-black">
                    <TableHead className="w-12">#</TableHead>
                    {parsedData.headers.map((header, idx) => (
                      <TableHead key={idx} className="min-w-[100px]">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, rowIdx) => (
                    <TableRow key={rowIdx}>
                      <TableCell className="font-mono font-bold text-muted-foreground">
                        {rowIdx + 1}
                      </TableCell>
                      {row.map((cell, cellIdx) => (
                        <TableCell
                          key={cellIdx}
                          className="text-sm max-w-[200px] truncate"
                        >
                          {cell || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parsedData.rows.length > 10 && (
              <div className="px-4 py-2 bg-muted/30 text-center text-sm text-muted-foreground border-t">
                ... and {parsedData.rows.length - 10} more rows
              </div>
            )}
          </div>
        )}

        {/* Import Button */}
        {!hasErrors && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || parsedData.rows.length === 0}
              className="flex-1"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import {parsedData.rows.length} Parts
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // File Upload Zone
  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-12 transition-all cursor-pointer",
          dragActive
            ? "border-primary-500 bg-primary-50"
            : "border-zinc-300 hover:border-primary-300 hover:bg-zinc-50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center text-center">
          <div
            className={cn(
              "h-16 w-16 rounded-2xl flex items-center justify-center mb-4",
              dragActive
                ? "bg-primary-500 text-white"
                : "bg-zinc-100 text-zinc-600"
            )}
          >
            <Upload className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight mb-2">
            {dragActive ? "Drop CSV File Here" : "Upload CSV File"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Drag and drop your CSV file here, or click to browse. The file
            should include headers for partNumber, name, and optionally
            description, quantity, minStock, unitCost, location, and
            manufacturer.
          </p>
        </div>
      </div>

      {/* Template Download */}
      <div className="rounded-xl border bg-muted/30 p-4 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm">Need a template?</h4>
          <p className="text-sm text-muted-foreground">
            Download our CSV template with the correct headers
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      {/* Expected Columns */}
      <div className="rounded-xl border bg-card p-4">
        <h4 className="font-bold text-sm mb-3">Expected CSV Columns</h4>
        <div className="grid gap-2 md:grid-cols-2">
          <ColumnInfo
            name="partNumber"
            required
            description="Unique identifier/SKU for the part"
          />
          <ColumnInfo
            name="name"
            required
            description="Display name of the part"
          />
          <ColumnInfo name="description" description="Part description" />
          <ColumnInfo
            name="quantity"
            description="Initial stock quantity (requires location)"
          />
          <ColumnInfo
            name="minStock"
            description="Minimum stock / reorder point"
          />
          <ColumnInfo
            name="unitCost"
            description="Cost per unit (e.g., 25.50)"
          />
          <ColumnInfo
            name="location"
            description="Storage location name or code"
          />
          <ColumnInfo
            name="manufacturer"
            description="Manufacturer/vendor name"
          />
        </div>
      </div>
    </div>
  );
}

function ColumnInfo({
  name,
  required,
  description,
}: {
  name: string;
  required?: boolean;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
      <code className="text-xs font-bold bg-zinc-200 px-1.5 py-0.5 rounded">
        {name}
      </code>
      {required && (
        <Badge variant="danger" className="text-[9px] px-1.5 py-0">
          Required
        </Badge>
      )}
      <span className="text-xs text-muted-foreground flex-1">
        {description}
      </span>
    </div>
  );
}
