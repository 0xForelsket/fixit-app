"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseCSV, validateCSVFile } from "@/lib/csv";
import {
  AlertTriangle,
  CheckCircle2,
  Cog,
  Download,
  FileSpreadsheet,
  Loader2,
  MapPin,
  Package,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";

type DuplicateStrategy = "skip" | "update" | "error";
type ResourceType = "equipment" | "spare-parts" | "locations" | "users";

interface ImportResult {
  success: boolean;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
    value?: string;
  }>;
  warnings: Array<{ row: number; field: string; message: string }>;
}

type Step = "select" | "upload" | "preview" | "result";

const resourceConfigs: Record<
  ResourceType,
  {
    label: string;
    icon: typeof Cog;
    endpoint: string;
    sampleCsv: string;
    sampleFilename: string;
    requiredColumns: Array<{ name: string; required: boolean }>;
  }
> = {
  equipment: {
    label: "Equipment",
    icon: Cog,
    endpoint: "/api/import/equipment",
    sampleCsv: `code,name,location_code,model_name,type_code,owner_employee_id,status
EQ-001,CNC Lathe,PLANT-A,Haas VF-2,CNC,TECH-001,operational
EQ-002,Hydraulic Press,PLANT-B,Parker 500T,PRESS,,maintenance`,
    sampleFilename: "equipment-import-template.csv",
    requiredColumns: [
      { name: "code", required: true },
      { name: "name", required: true },
      { name: "location_code", required: true },
      { name: "model_name", required: false },
      { name: "type_code", required: false },
      { name: "owner_employee_id", required: false },
    ],
  },
  "spare-parts": {
    label: "Spare Parts",
    icon: Package,
    endpoint: "/api/import/spare-parts",
    sampleCsv: `sku,name,category,description,barcode,unit_cost,reorder_point,lead_time_days
SPR-001,Hydraulic Seal Kit,hydraulic,Replacement seals for pumps,,25.50,10,7
SPR-002,Motor Bearings 6205,mechanical,SKF deep groove bearing,123456789012,12.00,20,14
SPR-003,Safety Gloves XL,safety,Cut-resistant work gloves,,8.99,50,3`,
    sampleFilename: "spare-parts-import-template.csv",
    requiredColumns: [
      { name: "sku", required: true },
      { name: "name", required: true },
      { name: "category", required: true },
      { name: "description", required: false },
      { name: "barcode", required: false },
      { name: "unit_cost", required: false },
      { name: "reorder_point", required: false },
      { name: "lead_time_days", required: false },
    ],
  },
  locations: {
    label: "Locations",
    icon: MapPin,
    endpoint: "/api/import/locations",
    sampleCsv: `code,name,description,parent_code
PLANT-A,Plant A,Main manufacturing facility,
PLANT-A-L1,Line 1,Assembly line 1,PLANT-A
PLANT-A-L2,Line 2,Assembly line 2,PLANT-A
PLANT-B,Plant B,Secondary facility,`,
    sampleFilename: "locations-import-template.csv",
    requiredColumns: [
      { name: "code", required: true },
      { name: "name", required: true },
      { name: "description", required: false },
      { name: "parent_code", required: false },
    ],
  },
  users: {
    label: "Users",
    icon: Users,
    endpoint: "/api/import/users",
    sampleCsv: `employee_id,name,email,pin,role_name,hourly_rate
TECH-NEW-001,John Smith,john@company.com,1234,tech,45.00
OP-NEW-001,Jane Doe,jane@company.com,5678,operator,
ADMIN-NEW-001,Bob Admin,bob@company.com,9999,admin,75.00`,
    sampleFilename: "users-import-template.csv",
    requiredColumns: [
      { name: "employee_id", required: true },
      { name: "name", required: true },
      { name: "email", required: false },
      { name: "pin", required: true },
      { name: "role_name", required: true },
      { name: "hourly_rate", required: false },
    ],
  },
};

export function ImportWizard() {
  const [step, setStep] = useState<Step>("select");
  const [resourceType, setResourceType] = useState<ResourceType>("equipment");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [duplicateStrategy, setDuplicateStrategy] =
    useState<DuplicateStrategy>("skip");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const config = resourceConfigs[resourceType];

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null);

    const validationError = validateCSVFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const content = await selectedFile.text();
      const { rows, headers: parsedHeaders } = parseCSV(content);

      if (rows.length === 0) {
        setError("CSV file is empty or has no data rows");
        return;
      }

      setFile(selectedFile);
      setHeaders(parsedHeaders);
      setPreviewRows(rows.slice(0, 10));
      setStep("preview");
    } catch {
      setError("Failed to parse CSV file");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  const handleImport = async (validateOnly: boolean) => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "options",
        JSON.stringify({ duplicateStrategy, validateOnly })
      );

      const res = await fetch(config.endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
        return;
      }

      setResult(data);
      if (!validateOnly) {
        setStep("result");
      }
    } catch {
      setError("Failed to import file");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep("select");
    setResourceType("equipment");
    setFile(null);
    setHeaders([]);
    setPreviewRows([]);
    setResult(null);
    setError(null);
  };

  const downloadSampleCsv = () => {
    const blob = new Blob([config.sampleCsv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = config.sampleFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {step === "select" && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-zinc-900">
              What would you like to import?
            </h2>
            <p className="text-zinc-500 mt-1">
              Choose a resource type to begin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {(Object.keys(resourceConfigs) as ResourceType[]).map((type) => {
              const cfg = resourceConfigs[type];
              const Icon = cfg.icon;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setResourceType(type);
                    setStep("upload");
                  }}
                  className="flex items-center gap-4 p-6 rounded-xl border-2 bg-white hover:border-primary-400 hover:bg-primary-50/50 transition-colors text-left"
                >
                  <div className="p-3 rounded-lg bg-primary-100">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">{cfg.label}</p>
                    <p className="text-sm text-zinc-500">
                      Import from CSV file
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === "upload" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = config.icon;
                return <Icon className="h-6 w-6 text-primary-500" />;
              })()}
              <div>
                <h2 className="font-bold text-zinc-900">
                  Import {config.label}
                </h2>
                <p className="text-sm text-zinc-500">
                  Upload a CSV file to import
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setStep("select")}>
              <X className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          <div
            className="rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-12 text-center hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-zinc-400" />
              <p className="mt-4 text-lg font-semibold text-zinc-700">
                Drop your CSV file here
              </p>
              <p className="mt-1 text-sm text-zinc-500">or click to browse</p>
            </label>
          </div>

          {error && (
            <div className="rounded-lg bg-danger-50 border border-danger-200 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-danger-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-danger-800">{error}</p>
              </div>
            </div>
          )}

          <div className="rounded-xl border-2 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900">Need a template?</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Download a sample CSV with the correct column headers
                </p>
              </div>
              <Button variant="outline" onClick={downloadSampleCsv}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
          </div>

          <div className="rounded-xl border-2 bg-white p-6">
            <h3 className="font-bold text-zinc-900 mb-4">Required Columns</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {config.requiredColumns.map((col) => (
                <div key={col.name} className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${col.required ? "bg-danger-500" : "bg-zinc-300"}`}
                  />
                  <span className="font-medium">{col.name}</span>
                  <span className="text-zinc-400">
                    ({col.required ? "required" : "optional"})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-6 w-6 text-primary-500" />
              <div>
                <p className="font-bold text-zinc-900">
                  {file?.name}{" "}
                  <span className="text-zinc-500 font-normal">
                    ({config.label})
                  </span>
                </p>
                <p className="text-sm text-zinc-500">
                  {previewRows.length} rows to import (showing first 10)
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={reset}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>

          <div className="rounded-xl border-2 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader className="bg-zinc-100 border-b">
                  <TableRow>
                    <TableHead className="px-4 py-3 text-left font-bold text-zinc-600 uppercase text-xs tracking-wider">
                      Row
                    </TableHead>
                    {headers.map((header) => (
                      <TableHead
                        key={header}
                        className="px-4 py-3 text-left font-bold text-zinc-600 uppercase text-xs tracking-wider"
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {previewRows.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-zinc-50">
                      <TableCell className="px-4 py-3 text-zinc-400 font-mono">
                        {idx + 2}
                      </TableCell>
                      {row.map((cell, cellIdx) => (
                        <TableCell
                          key={cellIdx}
                          className="px-4 py-3 text-zinc-900"
                        >
                          {cell || <span className="text-zinc-300">—</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="rounded-xl border-2 bg-white p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label
                  htmlFor="duplicate-strategy"
                  className="block text-sm font-bold text-zinc-700 mb-2"
                >
                  Duplicate Handling
                </label>
                <select
                  id="duplicate-strategy"
                  value={duplicateStrategy}
                  onChange={(e) =>
                    setDuplicateStrategy(e.target.value as DuplicateStrategy)
                  }
                  className="rounded-lg border-2 border-zinc-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="skip">Skip existing (keep original)</option>
                  <option value="update">Update existing</option>
                  <option value="error">Error on duplicate</option>
                </select>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleImport(true)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Validate Only
                </Button>
                <Button
                  onClick={() => handleImport(false)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Import {config.label}
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-danger-50 border border-danger-200 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-danger-500 shrink-0 mt-0.5" />
              <p className="font-medium text-danger-800">{error}</p>
            </div>
          )}

          {result && step === "preview" && (
            <div className="rounded-xl border-2 bg-white p-6 space-y-4">
              <h3 className="font-bold text-zinc-900">Validation Results</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-success-50">
                  <p className="text-2xl font-black text-success-600">
                    {result.inserted}
                  </p>
                  <p className="text-sm text-success-700">Will Insert</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary-50">
                  <p className="text-2xl font-black text-primary-600">
                    {result.updated}
                  </p>
                  <p className="text-sm text-primary-700">Will Update</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-zinc-100">
                  <p className="text-2xl font-black text-zinc-600">
                    {result.skipped}
                  </p>
                  <p className="text-sm text-zinc-600">Will Skip</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-bold text-danger-700 mb-2">
                    Errors ({result.errors.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-danger-200 bg-danger-50">
                    <Table className="w-full text-sm">
                      <TableHeader className="bg-danger-100 sticky top-0">
                        <TableRow>
                          <TableHead className="px-3 py-2 text-left text-danger-800">
                            Row
                          </TableHead>
                          <TableHead className="px-3 py-2 text-left text-danger-800">
                            Field
                          </TableHead>
                          <TableHead className="px-3 py-2 text-left text-danger-800">
                            Error
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-danger-200">
                        {result.errors.map((err, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="px-3 py-2 font-mono text-danger-700">
                              {err.row}
                            </TableCell>
                            <TableCell className="px-3 py-2 text-danger-700">
                              {err.field || "—"}
                            </TableCell>
                            <TableCell className="px-3 py-2 text-danger-800">
                              {err.message}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-bold text-warning-700 mb-2">
                    Warnings ({result.warnings.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm text-warning-800">
                    {result.warnings.map((warn, idx) => (
                      <p key={idx}>
                        Row {warn.row}: {warn.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === "result" && result && (
        <div className="space-y-6">
          <div className="rounded-xl border-2 bg-white p-8 text-center">
            {result.success ? (
              <>
                <CheckCircle2 className="mx-auto h-16 w-16 text-success-500" />
                <h2 className="mt-4 text-2xl font-black text-zinc-900">
                  Import Complete
                </h2>
              </>
            ) : (
              <>
                <AlertTriangle className="mx-auto h-16 w-16 text-warning-500" />
                <h2 className="mt-4 text-2xl font-black text-zinc-900">
                  Import Completed with Errors
                </h2>
              </>
            )}

            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="text-center p-4 rounded-lg bg-success-50">
                <p className="text-3xl font-black text-success-600">
                  {result.inserted}
                </p>
                <p className="text-sm text-success-700 font-medium">Inserted</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary-50">
                <p className="text-3xl font-black text-primary-600">
                  {result.updated}
                </p>
                <p className="text-sm text-primary-700 font-medium">Updated</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-zinc-100">
                <p className="text-3xl font-black text-zinc-600">
                  {result.skipped}
                </p>
                <p className="text-sm text-zinc-600 font-medium">Skipped</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-6 text-left max-w-2xl mx-auto">
                <h4 className="font-bold text-danger-700 mb-2">
                  Failed Rows ({result.errors.length})
                </h4>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-danger-200 bg-danger-50">
                  <Table className="w-full text-sm">
                    <TableHeader className="bg-danger-100 sticky top-0">
                      <TableRow>
                        <TableHead className="px-3 py-2 text-left text-danger-800">
                          Row
                        </TableHead>
                        <TableHead className="px-3 py-2 text-left text-danger-800">
                          Field
                        </TableHead>
                        <TableHead className="px-3 py-2 text-left text-danger-800">
                          Error
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-danger-200">
                      {result.errors.map((err, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="px-3 py-2 font-mono text-danger-700">
                            {err.row}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-danger-700">
                            {err.field || "—"}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-danger-800">
                            {err.message}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="mt-8">
              <Button onClick={reset}>Import Another File</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
