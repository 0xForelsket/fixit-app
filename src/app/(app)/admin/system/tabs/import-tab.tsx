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
    icon: React.ElementType;
    description: string;
    templateUrl: string;
    requiredColumns: string[];
    endpoint: string;
  }
> = {
  equipment: {
    label: "Equipment",
    icon: Cog,
    description: "Import machines and equipment",
    templateUrl: "/templates/equipment-import.csv",
    requiredColumns: ["code", "name"],
    endpoint: "/api/import/equipment",
  },
  "spare-parts": {
    label: "Spare Parts",
    icon: Package,
    description: "Import spare parts inventory",
    templateUrl: "/templates/spare-parts-import.csv",
    requiredColumns: ["partNumber", "name"],
    endpoint: "/api/import/spare-parts",
  },
  locations: {
    label: "Locations",
    icon: MapPin,
    description: "Import facility locations",
    templateUrl: "/templates/locations-import.csv",
    requiredColumns: ["code", "name"],
    endpoint: "/api/import/locations",
  },
  users: {
    label: "Users",
    icon: Users,
    description: "Import user accounts",
    templateUrl: "/templates/users-import.csv",
    requiredColumns: ["employeeId", "name", "pin"],
    endpoint: "/api/import/users",
  },
};

export function ImportTab() {
  const [step, setStep] = useState<Step>("select");
  const [selectedType, setSelectedType] = useState<ResourceType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] =
    useState<DuplicateStrategy>("skip");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      if (!selectedType) return;

      const validationError = validateCSVFile(selectedFile);
      if (validationError) {
        alert(validationError);
        return;
      }

      try {
        const text = await selectedFile.text();
        const data = parseCSV(text);
        setFile(selectedFile);
        setCsvData([data.headers, ...data.rows]);
        setStep("preview");
      } catch {
        alert("Failed to parse CSV file");
      }
    },
    [selectedType]
  );

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

  const handleImport = async () => {
    if (!selectedType || !csvData) return;

    setIsImporting(true);
    try {
      const response = await fetch(resourceConfigs[selectedType].endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: csvData,
          duplicateStrategy,
        }),
      });

      const importResult = await response.json();
      setResult(importResult);
      setStep("result");
    } catch {
      alert("Import failed. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const reset = () => {
    setStep("select");
    setSelectedType(null);
    setFile(null);
    setCsvData(null);
    setResult(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Step: Select Resource Type */}
      {step === "select" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select the type of data you want to import
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(resourceConfigs).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedType(key as ResourceType);
                  setStep("upload");
                }}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <config.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {config.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {config.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Upload File */}
      {step === "upload" && selectedType && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Import {resourceConfigs[selectedType].label}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="rounded-full"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-12 transition-colors hover:border-primary/50"
          >
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-foreground mb-2">
              Drag and drop your CSV file here
            </p>
            <p className="text-xs text-muted-foreground mb-4">or</p>
            <label className="cursor-pointer">
              <Button variant="outline" className="rounded-full" asChild>
                <span>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Browse Files
                </span>
              </Button>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileSelect(selectedFile);
                }}
              />
            </label>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Download className="h-4 w-4" />
            <a
              href={resourceConfigs[selectedType].templateUrl}
              className="text-primary hover:underline"
            >
              Download template CSV
            </a>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && csvData && selectedType && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Preview Import</h3>
              <p className="text-sm text-muted-foreground">
                {file?.name} - {csvData.length - 1} rows
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="rounded-full"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>

          <div className="rounded-xl border overflow-hidden">
            <div className="max-h-64 overflow-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0">
                  <TableRow>
                    {csvData[0]?.map((header, i) => (
                      <TableHead
                        key={i}
                        className="text-[10px] font-bold uppercase"
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.slice(1, 6).map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j} className="text-sm">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {csvData.length > 6 && (
              <div className="border-t p-2 text-center text-xs text-muted-foreground">
                + {csvData.length - 6} more rows
              </div>
            )}
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm font-medium mb-3">Duplicate Handling</p>
            <div className="flex gap-4">
              {[
                { value: "skip", label: "Skip duplicates" },
                { value: "update", label: "Update existing" },
                { value: "error", label: "Report errors" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="duplicateStrategy"
                    value={option.value}
                    checked={duplicateStrategy === option.value}
                    onChange={(e) =>
                      setDuplicateStrategy(e.target.value as DuplicateStrategy)
                    }
                    className="text-primary"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("upload")}
              className="rounded-full"
            >
              Back
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting}
              className="rounded-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import {csvData.length - 1} Rows
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Result */}
      {step === "result" && result && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            {result.success ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            )}
            <div>
              <h3 className="text-lg font-semibold">
                {result.success
                  ? "Import Complete"
                  : "Import Completed with Issues"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {result.inserted} inserted, {result.updated} updated,{" "}
                {result.skipped} skipped
              </p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30 p-4">
              <p className="text-sm font-medium text-rose-800 dark:text-rose-200 mb-2">
                Errors ({result.errors.length})
              </p>
              <ul className="space-y-1 text-sm text-rose-700 dark:text-rose-300">
                {result.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>
                    Row {err.row}: {err.message}
                  </li>
                ))}
                {result.errors.length > 5 && (
                  <li>+ {result.errors.length - 5} more errors</li>
                )}
              </ul>
            </div>
          )}

          <Button onClick={reset} className="rounded-full">
            Import More Data
          </Button>
        </div>
      )}
    </div>
  );
}
