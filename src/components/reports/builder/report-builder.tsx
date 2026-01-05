"use client";

import {
  type AnalyticsDateRange,
  type ChartData,
  getInventoryStats,
  getLaborStats,
  getStatsSummary,
  getWorkOrderStats,
} from "@/actions/analytics";
import { saveReportTemplate } from "@/actions/reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Copy,
  FileText,
  GripVertical,
  LayoutGrid,
  PieChart as PieChartIcon,
  Save,
  Table as TableIcon,
  Trash2,
  Type,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type {
  DataSource,
  DateRangeFilter,
  ReportConfig,
  WidgetConfig,
  WidgetType,
} from "./types";
import {
  type Layout,
  WIDGET_DEFAULT_SIZES,
  findNextWidgetPosition,
} from "./widget-grid";

// ============ LAZY LOADED COMPONENTS ============

// Loading skeleton for chart components
function ChartSkeleton() {
  return <Skeleton className="h-[180px] w-full rounded-lg" />;
}

// Loading skeleton for grid
function GridSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
      ))}
    </div>
  );
}

// Loading skeleton for schedule dialog button
function ScheduleButtonSkeleton() {
  return <Skeleton className="h-10 w-full rounded-lg" />;
}

// Lazy load heavy chart components (recharts is ~200KB gzipped)
const BarChartWidget = dynamic(
  () => import("./charts/bar-chart-widget").then((mod) => mod.BarChartWidget),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const PieChartWidget = dynamic(
  () => import("./charts/pie-chart-widget").then((mod) => mod.PieChartWidget),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

// Lazy load the grid component (react-grid-layout)
const WidgetGrid = dynamic(
  () => import("./widget-grid").then((mod) => mod.WidgetGrid),
  { ssr: false, loading: () => <GridSkeleton /> }
);

// Lazy load ScheduleDialog (only needed when scheduling reports)
const ScheduleDialog = dynamic(
  () => import("./schedule-dialog").then((mod) => mod.ScheduleDialog),
  { ssr: false, loading: () => <ScheduleButtonSkeleton /> }
);

// Lazy load DateRangePicker components
const DateRangePicker = dynamic(
  () => import("./date-range-picker").then((mod) => mod.DateRangePicker),
  { ssr: false, loading: () => <Skeleton className="h-9 w-full rounded-lg" /> }
);

const WidgetDateRangePicker = dynamic(
  () => import("./date-range-picker").then((mod) => mod.WidgetDateRangePicker),
  { ssr: false, loading: () => <Skeleton className="h-7 w-[140px] rounded" /> }
);

// ============ CONSTANTS ============

// Data source options for widgets
const DATA_SOURCES: { value: DataSource; label: string }[] = [
  { value: "work_orders", label: "Work Orders" },
  { value: "inventory", label: "Inventory" },
  { value: "labor", label: "Labor Hours" },
];

// Placeholder data for previews
const MOCK_DATA = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 300 },
  { name: "Mar", value: 600 },
  { name: "Apr", value: 200 },
  { name: "May", value: 500 },
];

// ============ MAIN COMPONENT ============

export function ReportBuilder({
  initialTemplate,
  userId,
}: {
  initialTemplate?: { id?: string; config: ReportConfig };
  userId: string;
}) {
  const [config, setConfig] = useState<ReportConfig>(
    initialTemplate?.config || {
      title: "New Report",
      description: "",
      widgets: [],
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const addWidget = useCallback((type: WidgetType) => {
    const defaultSize = WIDGET_DEFAULT_SIZES[type] || { w: 6, h: 3 };

    setConfig((prev) => {
      const position = findNextWidgetPosition(prev.widgets, type);
      const newWidget: WidgetConfig = {
        id: crypto.randomUUID(),
        type,
        title: type === "text_block" ? "Text Section" : "New Widget",
        dataSource: "work_orders",
        layout: {
          id: crypto.randomUUID(),
          ...position,
          ...defaultSize,
        },
        filters: {},
      };
      return { ...prev, widgets: [...prev.widgets, newWidget] };
    });
  }, []);

  const handleLayoutChange = useCallback((layouts: Layout[]) => {
    setConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.map((widget) => {
        const layout = layouts.find((l) => l.i === widget.id);
        if (layout) {
          return {
            ...widget,
            layout: {
              ...widget.layout,
              x: layout.x,
              y: layout.y,
              w: layout.w,
              h: layout.h,
            },
          };
        }
        return widget;
      }),
    }));
  }, []);

  const updateWidget = useCallback(
    (id: string, updates: Partial<WidgetConfig>) => {
      setConfig((prev) => ({
        ...prev,
        widgets: prev.widgets.map((w) =>
          w.id === id ? { ...w, ...updates } : w
        ),
      }));
    },
    []
  );

  const removeWidget = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== id),
    }));
  }, []);

  const duplicateWidget = useCallback((id: string) => {
    setConfig((prev) => {
      const widget = prev.widgets.find((w) => w.id === id);
      if (!widget) return prev;

      const position = findNextWidgetPosition(prev.widgets, widget.type);
      const newWidget: WidgetConfig = {
        ...widget,
        id: crypto.randomUUID(),
        title: `${widget.title} (Copy)`,
        layout: {
          ...widget.layout,
          id: crypto.randomUUID(),
          ...position,
        },
      };
      return { ...prev, widgets: [...prev.widgets, newWidget] };
    });
  }, []);

  const handleGlobalDateRangeChange = useCallback(
    (dateRange: DateRangeFilter | undefined) => {
      setConfig((prev) => ({
        ...prev,
        globalDateRange: dateRange,
      }));
    },
    []
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveReportTemplate({
        id: initialTemplate?.id,
        name: config.title,
        description: config.description,
        config,
        createdById: userId,
      });
      toast({
        title: "Report saved",
        description: "Your report template has been saved successfully.",
      });
      router.refresh();
    } catch {
      toast({
        title: "Error",
        description: "Failed to save report.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Sort widgets by y position then x for rendering
  const sortedWidgets = useMemo(() => {
    return [...config.widgets].sort((a, b) => {
      if (a.layout.y !== b.layout.y) return a.layout.y - b.layout.y;
      return a.layout.x - b.layout.x;
    });
  }, [config.widgets]);

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      {/* Sidebar Palette */}
      <div className="w-64 flex-none space-y-6 overflow-y-auto">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 font-bold text-sm text-muted-foreground uppercase tracking-wider">
            Components
          </h3>
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => addWidget("stats_summary")}
            >
              <LayoutGrid className="h-4 w-4 text-emerald-500" />
              Stats Summary
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => addWidget("bar_chart")}
            >
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Bar Chart
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => addWidget("pie_chart")}
            >
              <PieChartIcon className="h-4 w-4 text-purple-500" />
              Pie Chart
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => addWidget("data_table")}
            >
              <TableIcon className="h-4 w-4 text-amber-500" />
              Data Table
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => addWidget("text_block")}
            >
              <Type className="h-4 w-4 text-gray-500" />
              Text Block
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 font-bold text-sm text-muted-foreground uppercase tracking-wider">
            Report Settings
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-title">Report Title</Label>
              <Input
                id="report-title"
                value={config.title}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-description">Description</Label>
              <Textarea
                id="report-description"
                value={config.description || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            {/* Global Date Range Filter */}
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs uppercase tracking-wider">
                Global Date Range
              </Label>
              <DateRangePicker
                value={config.globalDateRange}
                onChange={handleGlobalDateRangeChange}
              />
            </div>

            <Button
              className="w-full font-bold"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "SAVING..." : "SAVE TEMPLATE"}
            </Button>

            {initialTemplate?.id && (
              <ScheduleDialog
                templateId={initialTemplate.id}
                templateName={config.title}
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 overflow-y-auto rounded-2xl border-2 border-dashed border-border/50 bg-muted/20 p-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight">
              {config.title || "Untitled Report"}
            </h1>
            <p className="text-muted-foreground">{config.description}</p>
            {config.globalDateRange?.startDate && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                Date Range: {config.globalDateRange.startDate} —{" "}
                {config.globalDateRange.endDate}
              </p>
            )}
          </div>

          {config.widgets.length === 0 ? (
            <div className="flex h-80 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 text-muted-foreground">
              <FileText className="mb-4 h-16 w-16 opacity-20" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Start Building Your Report
              </h3>
              <p className="mb-6 max-w-sm text-center text-sm">
                Add widgets from the sidebar to create your custom report. You
                can drag to reorder and resize them.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addWidget("stats_summary")}
                  className="gap-1.5"
                >
                  <LayoutGrid className="h-4 w-4 text-emerald-500" />
                  Stats
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addWidget("bar_chart")}
                  className="gap-1.5"
                >
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  Chart
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addWidget("text_block")}
                  className="gap-1.5"
                >
                  <Type className="h-4 w-4 text-gray-500" />
                  Text
                </Button>
              </div>
            </div>
          ) : (
            <Suspense fallback={<GridSkeleton />}>
              <WidgetGrid
                widgets={sortedWidgets}
                onLayoutChange={handleLayoutChange}
              >
                {sortedWidgets.map((widget) => (
                  <div key={widget.id}>
                    <WidgetCard
                      widget={widget}
                      onRemove={removeWidget}
                      onUpdate={updateWidget}
                      onDuplicate={duplicateWidget}
                      globalDateRange={config.globalDateRange}
                    />
                  </div>
                ))}
              </WidgetGrid>
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ HELPER COMPONENTS ============

/**
 * Reusable data source selector for widgets
 */
function DataSourceSelect({
  value,
  onChange,
}: {
  value: DataSource;
  onChange: (value: DataSource) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Label className="text-xs text-muted-foreground uppercase whitespace-nowrap">
        Data:
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 w-[140px] text-[10px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATA_SOURCES.map((source) => (
            <SelectItem key={source.value} value={source.value}>
              {source.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Loading skeleton for widget content
 */
function WidgetSkeleton({ type }: { type: WidgetType }) {
  if (type === "stats_summary") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "bar_chart" || type === "pie_chart") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[180px] w-full rounded-lg" />
      </div>
    );
  }

  if (type === "data_table") {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  return <Skeleton className="h-[100px] w-full" />;
}

// ============ WIDGET CARD COMPONENT ============

/**
 * Widget card component with resize support via react-grid-layout
 */
function WidgetCard({
  widget,
  onRemove,
  onUpdate,
  onDuplicate,
  globalDateRange,
}: {
  widget: WidgetConfig;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WidgetConfig>) => void;
  onDuplicate: (id: string) => void;
  globalDateRange?: DateRangeFilter;
}) {
  const [chartData, setChartData] = useState<ChartData>([]);
  const [summaryData, setSummaryData] = useState<
    { label: string; value: string | number }[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Use widget-specific date range if set, otherwise fall back to global
  const effectiveDateRange = widget.dateRange || globalDateRange;

  // Convert to AnalyticsDateRange format
  const analyticsDateRange: AnalyticsDateRange | undefined = useMemo(() => {
    if (!effectiveDateRange?.startDate) return undefined;
    return {
      startDate: effectiveDateRange.startDate,
      endDate: effectiveDateRange.endDate,
    };
  }, [effectiveDateRange]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (widget.type === "stats_summary") {
          if (
            widget.dataSource === "work_orders" ||
            widget.dataSource === "inventory" ||
            widget.dataSource === "labor"
          ) {
            const data = await getStatsSummary(
              widget.dataSource,
              analyticsDateRange
            );
            setSummaryData(data);
          }
        } else if (widget.type === "bar_chart" || widget.type === "pie_chart") {
          let data: ChartData = [];
          if (widget.dataSource === "work_orders") {
            data = await getWorkOrderStats(analyticsDateRange);
          } else if (widget.dataSource === "inventory") {
            data = await getInventoryStats();
          } else if (widget.dataSource === "labor") {
            data = await getLaborStats(analyticsDateRange);
          }
          setChartData(data);
        }
      } catch (error) {
        console.error("Failed to fetch widget data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [widget.dataSource, widget.type, analyticsDateRange]);

  const handleDataSourceChange = (value: DataSource) => {
    onUpdate(widget.id, { dataSource: value });
  };

  const handleWidgetDateRangeChange = (
    dateRange: DateRangeFilter | undefined
  ) => {
    onUpdate(widget.id, { dateRange });
  };

  const displayData = chartData.length > 0 ? chartData : MOCK_DATA;

  return (
    <div
      className={cn(
        "group relative h-full rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md flex flex-col overflow-hidden"
      )}
    >
      {/* Widget Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="widget-drag-handle cursor-grab hover:text-primary active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <Input
            value={widget.title}
            onChange={(e) => onUpdate(widget.id, { title: e.target.value })}
            className="h-7 w-[160px] border-transparent bg-transparent text-sm font-bold hover:border-border focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDuplicate(widget.id)}
            title="Duplicate widget"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onRemove(widget.id)}
            title="Remove widget"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Widget Content Area */}
      <div className="flex-1 p-4 overflow-auto min-h-0">
        {loading ? (
          <WidgetSkeleton type={widget.type} />
        ) : (
          <>
            {/* Text Block */}
            {widget.type === "text_block" && (
              <Textarea
                placeholder="Enter text content here..."
                className="min-h-[80px] h-full border-dashed resize-none"
                value={(widget.filters?.text as string) || ""}
                onChange={(e) =>
                  onUpdate(widget.id, {
                    filters: { ...widget.filters, text: e.target.value },
                  })
                }
              />
            )}

            {/* Bar Chart - Lazy Loaded */}
            {widget.type === "bar_chart" && (
              <div className="h-full flex flex-col gap-2">
                <div className="flex-1 min-h-[150px]">
                  <Suspense fallback={<ChartSkeleton />}>
                    <BarChartWidget data={displayData} />
                  </Suspense>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-border flex-shrink-0">
                  <DataSourceSelect
                    value={widget.dataSource}
                    onChange={handleDataSourceChange}
                  />
                  <WidgetDateRangePicker
                    value={widget.dateRange}
                    onChange={handleWidgetDateRangeChange}
                  />
                </div>
              </div>
            )}

            {/* Pie Chart - Lazy Loaded */}
            {widget.type === "pie_chart" && (
              <div className="h-full flex flex-col gap-2">
                <div className="flex-1 min-h-[150px]">
                  <Suspense fallback={<ChartSkeleton />}>
                    <PieChartWidget data={displayData} />
                  </Suspense>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-border flex-shrink-0">
                  <DataSourceSelect
                    value={widget.dataSource}
                    onChange={handleDataSourceChange}
                  />
                  <WidgetDateRangePicker
                    value={widget.dateRange}
                    onChange={handleWidgetDateRangeChange}
                  />
                </div>
              </div>
            )}

            {/* Stats Summary */}
            {widget.type === "stats_summary" && (
              <div className="h-full flex flex-col gap-2">
                <div className="flex-1 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {summaryData.length > 0
                    ? summaryData.map((s, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-gradient-to-br from-card to-muted/30 p-3"
                        >
                          <div className="text-xl font-bold">{s.value}</div>
                          <div className="text-[10px] font-bold uppercase text-muted-foreground">
                            {s.label}
                          </div>
                        </div>
                      ))
                    : [1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-card p-3"
                        >
                          <div className="text-xl font-bold">--</div>
                          <div className="text-[10px] font-bold uppercase text-muted-foreground">
                            Metric {i}
                          </div>
                        </div>
                      ))}
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-border flex-shrink-0">
                  <DataSourceSelect
                    value={widget.dataSource}
                    onChange={handleDataSourceChange}
                  />
                  <WidgetDateRangePicker
                    value={widget.dateRange}
                    onChange={handleWidgetDateRangeChange}
                  />
                </div>
              </div>
            )}

            {/* Data Table */}
            {widget.type === "data_table" && (
              <div className="h-full flex flex-col gap-2">
                <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/10 min-h-[120px]">
                  <div className="text-center text-muted-foreground">
                    <TableIcon className="mx-auto mb-2 h-10 w-10 opacity-50" />
                    <p className="font-medium text-sm">Data Table Preview</p>
                    <p className="text-xs">
                      Tables are populated with live data on report generation
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-border flex-shrink-0">
                  <DataSourceSelect
                    value={widget.dataSource}
                    onChange={handleDataSourceChange}
                  />
                  <WidgetDateRangePicker
                    value={widget.dateRange}
                    onChange={handleWidgetDateRangeChange}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
