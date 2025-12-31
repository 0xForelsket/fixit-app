"use client";

import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

// ============================================================================
// TYPES
// ============================================================================

export type SortDirection = "asc" | "desc";

export interface SortState {
  field: string;
  direction: SortDirection;
}

export interface ColumnDef<TData> {
  /** Unique identifier for the column, used for sorting */
  id: string;
  /** Header label to display */
  header: string;
  /** Enable sorting for this column (default: false) */
  sortable?: boolean;
  /** Cell renderer function */
  cell: (row: TData, index: number) => React.ReactNode;
  /** Custom header renderer (overrides default header) */
  headerRenderer?: () => React.ReactNode;
  /** Column alignment */
  align?: "left" | "center" | "right";
  /** Column width (CSS value) */
  width?: string;
  /** Responsive visibility - hide column below this breakpoint */
  hideBelow?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** Additional className for header cell */
  headerClassName?: string;
  /** Additional className for body cells */
  cellClassName?: string;
  /** Disable column resizing for this column */
  resizable?: boolean;
}

export interface DataTableProps<TData> {
  /** Column definitions */
  columns: ColumnDef<TData>[];
  /** Data array to render */
  data: TData[];
  /** Current search params (for URL-based sorting) */
  searchParams?: Record<string, string | undefined>;
  /** Get unique key for each row */
  getRowId: (row: TData) => string | number;
  /** Handle row click - receives the row data */
  onRowClick?: (row: TData) => void;
  /** Generate href for row click (alternative to onRowClick) */
  getRowHref?: (row: TData) => string;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Custom empty state icon */
  emptyIcon?: React.ComponentType<{ className?: string }>;
  /** Enable staggered row animations */
  enableAnimations?: boolean;
  /** Maximum rows to apply stagger animation to */
  maxStaggerRows?: number;
  /** Additional className for table container */
  className?: string;
  /** Additional className for table element */
  tableClassName?: string;
  /** Compact mode - reduces padding */
  compact?: boolean;
  /** Custom row className function */
  getRowClassName?: (row: TData, index: number) => string;
  /** Enable row selection */
  selectable?: boolean;
  /** Currently selected row IDs */
  selectedIds?: (string | number)[];
  /** Callback when a row is selected/deselected */
  onSelect?: (id: string | number) => void;
  /** Callback when select all is toggled */
  onSelectAll?: () => void;
}

// ============================================================================
// UTILITY: Responsive visibility classes
// ============================================================================

const hideClasses: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
  "2xl": "hidden 2xl:table-cell",
};

const alignClasses: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

// ============================================================================
// SORTABLE HEADER COMPONENT
// ============================================================================

interface SortableHeaderProps {
  column: ColumnDef<unknown>;
  currentSort?: string;
  currentDir?: string;
  params: Record<string, string | undefined>;
  compact?: boolean;
}

function SortableHeader({
  column,
  currentSort,
  currentDir,
  params,
  compact,
}: SortableHeaderProps) {
  const isActive = currentSort === column.id;
  const nextDir = isActive && currentDir === "asc" ? "desc" : "asc";

  const query = new URLSearchParams();

  // Preserve all existing params except sort, dir, and page
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "sort" && key !== "dir" && key !== "page") {
      query.set(key, value);
    }
  }

  query.set("sort", column.id);
  query.set("dir", nextDir);

  const hideClass = column.hideBelow ? hideClasses[column.hideBelow] : "";
  const alignClass = alignClasses[column.align || "left"];

  return (
    <TableHead
      className={cn(
        compact ? "p-2" : "p-3",
        "text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:bg-muted/50 hover:text-foreground transition-colors select-none group",
        hideClass,
        alignClass,
        column.headerClassName
      )}
      style={column.width ? { width: column.width } : undefined}
      resizable={column.resizable}
    >
      <Link
        href={`?${query.toString()}`}
        className="flex items-center gap-2 w-full"
      >
        {column.headerRenderer ? column.headerRenderer() : column.header}
        {isActive ? (
          currentDir === "asc" ? (
            <ArrowUp className="h-3 w-3 text-primary shrink-0" />
          ) : (
            <ArrowDown className="h-3 w-3 text-primary shrink-0" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        )}
      </Link>
    </TableHead>
  );
}

// ============================================================================
// STATIC HEADER COMPONENT
// ============================================================================

interface StaticHeaderProps {
  column: ColumnDef<unknown>;
  compact?: boolean;
}

function StaticHeader({ column, compact }: StaticHeaderProps) {
  const hideClass = column.hideBelow ? hideClasses[column.hideBelow] : "";
  const alignClass = alignClasses[column.align || "left"];

  return (
    <TableHead
      className={cn(
        compact ? "p-2" : "p-3",
        "text-[10px] font-black uppercase tracking-widest text-muted-foreground",
        hideClass,
        alignClass,
        column.headerClassName
      )}
      style={column.width ? { width: column.width } : undefined}
      resizable={column.resizable}
    >
      {column.headerRenderer ? column.headerRenderer() : column.header}
    </TableHead>
  );
}

// ============================================================================
// DATA TABLE ROW
// ============================================================================

interface DataTableRowProps<TData> {
  row: TData;
  rowId: string | number;
  index: number;
  columns: ColumnDef<TData>[];
  onRowClick?: (row: TData) => void;
  getRowHref?: (row: TData) => string;
  enableAnimations?: boolean;
  maxStaggerRows?: number;
  compact?: boolean;
  getRowClassName?: (row: TData, index: number) => string;
  selectable?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string | number) => void;
}

function DataTableRow<TData>({
  row,
  rowId,
  index,
  columns,
  onRowClick,
  getRowHref,
  enableAnimations = true,
  maxStaggerRows = 5,
  compact,
  getRowClassName,
  selectable,
  isSelected,
  onSelect,
}: DataTableRowProps<TData>) {
  const router = useRouter();
  const isClickable = !!onRowClick || !!getRowHref;

  const staggerClass =
    enableAnimations && index < maxStaggerRows
      ? `animate-stagger-${index + 1}`
      : enableAnimations
        ? "animate-in fade-in duration-500"
        : "";

  const handleClick = () => {
    if (getRowHref) {
      router.push(getRowHref(row));
    } else if (onRowClick) {
      onRowClick(row);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === "Enter" || e.key === " ")) {
      handleClick();
    }
  };

  const customClass = getRowClassName ? getRowClassName(row, index) : "";

  return (
    <TableRow
      className={cn(
        "group transition-colors",
        enableAnimations && "animate-in fade-in slide-in-from-bottom-1",
        isClickable && "cursor-pointer hover:bg-muted/50 active:bg-muted/60",
        isSelected && "bg-primary/5",
        staggerClass,
        customClass
      )}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {selectable && (
        <TableCell
          className={cn(compact ? "p-2" : "p-3", "w-12")}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onSelect?.(rowId)}
            className={cn(
              "h-5 w-5 rounded border-2 flex items-center justify-center transition-all mx-auto",
              isSelected
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/30 hover:border-primary"
            )}
          >
            {isSelected && (
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        </TableCell>
      )}
      {columns.map((column) => {
        const hideClass = column.hideBelow ? hideClasses[column.hideBelow] : "";
        const alignClass = alignClasses[column.align || "left"];

        return (
          <TableCell
            key={column.id}
            className={cn(
              compact ? "p-2 text-xs" : "p-3 text-sm",
              hideClass,
              alignClass,
              column.cellClassName
            )}
          >
            {column.cell(row, index)}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  message: string;
  icon?: React.ComponentType<{ className?: string }>;
  colSpan: number;
}

function EmptyState({ message, icon: Icon = Inbox, colSpan }: EmptyStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-48">
        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
            <Icon className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">{message}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// MAIN DATA TABLE COMPONENT
// ============================================================================

export function DataTable<TData>({
  columns,
  data,
  searchParams = {},
  getRowId,
  onRowClick,
  getRowHref,
  emptyMessage = "No data available",
  emptyIcon,
  enableAnimations = true,
  maxStaggerRows = 5,
  className,
  tableClassName,
  compact = false,
  getRowClassName,
  selectable = false,
  selectedIds = [],
  onSelect,
  onSelectAll,
}: DataTableProps<TData>) {
  const currentSort = searchParams.sort;
  const currentDir = searchParams.dir;

  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && !allSelected;
  const colSpan = selectable ? columns.length + 1 : columns.length;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors",
        className
      )}
    >
      <Table className={tableClassName}>
        <TableHeader className="bg-muted/30">
          <TableRow className="border-b hover:bg-transparent">
            {selectable && (
              <TableHead className={cn(compact ? "p-2" : "p-3", "w-12")}>
                <button
                  type="button"
                  onClick={onSelectAll}
                  className={cn(
                    "h-5 w-5 rounded border-2 flex items-center justify-center transition-all mx-auto",
                    allSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : someSelected
                        ? "bg-primary/50 border-primary text-primary-foreground"
                        : "border-muted-foreground/30 hover:border-primary"
                  )}
                >
                  {(allSelected || someSelected) && (
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      {allSelected ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 12h14"
                        />
                      )}
                    </svg>
                  )}
                </button>
              </TableHead>
            )}
            {columns.map((column) =>
              column.sortable ? (
                <SortableHeader
                  key={column.id}
                  column={column as ColumnDef<unknown>}
                  currentSort={currentSort}
                  currentDir={currentDir}
                  params={searchParams}
                  compact={compact}
                />
              ) : (
                <StaticHeader
                  key={column.id}
                  column={column as ColumnDef<unknown>}
                  compact={compact}
                />
              )
            )}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border">
          {data.length === 0 ? (
            <EmptyState
              message={emptyMessage}
              icon={emptyIcon}
              colSpan={colSpan}
            />
          ) : (
            data.map((row, index) => {
              const rowId = getRowId(row);
              return (
                <DataTableRow
                  key={rowId}
                  row={row}
                  rowId={rowId}
                  index={index}
                  columns={columns}
                  onRowClick={onRowClick}
                  getRowHref={getRowHref}
                  enableAnimations={enableAnimations}
                  maxStaggerRows={maxStaggerRows}
                  compact={compact}
                  getRowClassName={getRowClassName}
                  selectable={selectable}
                  isSelected={selectedIds.includes(rowId)}
                  onSelect={onSelect}
                />
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================================
// HELPER EXPORTS
// ============================================================================

export { hideClasses, alignClasses };
