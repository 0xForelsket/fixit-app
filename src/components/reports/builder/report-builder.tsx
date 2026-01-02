"use client";

import {
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
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ScheduleDialog } from "./schedule-dialog";
import type {
  DataSource,
  ReportConfig,
  WidgetConfig,
  WidgetType,
} from "./types";

// Colors for pie chart segments
const PIE_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

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

  const addWidget = (type: WidgetType) => {
    const newWidget: WidgetConfig = {
      id: crypto.randomUUID(),
      type,
      title: type === "text_block" ? "Text Section" : "New Widget",
      dataSource: "work_orders",
      layout: { id: crypto.randomUUID(), x: 0, y: 0, w: 12, h: 4 },
      filters: {},
    };
    setConfig((prev) => ({ ...prev, widgets: [...prev.widgets, newWidget] }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setConfig((prev) => {
        const oldIndex = prev.widgets.findIndex((w) => w.id === active.id);
        const newIndex = prev.widgets.findIndex((w) => w.id === over.id);

        return {
          ...prev,
          widgets: arrayMove(prev.widgets, oldIndex, newIndex),
        };
      });
    }
  };

  const updateWidget = (id: string, updates: Partial<WidgetConfig>) => {
    setConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    }));
  };

  const removeWidget = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== id),
    }));
  };

  const duplicateWidget = (id: string) => {
    setConfig((prev) => {
      const widget = prev.widgets.find((w) => w.id === id);
      if (!widget) return prev;
      const newWidget: WidgetConfig = {
        ...widget,
        id: crypto.randomUUID(),
        title: `${widget.title} (Copy)`,
        layout: { ...widget.layout, id: crypto.randomUUID() },
      };
      const index = prev.widgets.findIndex((w) => w.id === id);
      const newWidgets = [...prev.widgets];
      newWidgets.splice(index + 1, 0, newWidget);
      return { ...prev, widgets: newWidgets };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveReportTemplate({
        id: initialTemplate?.id,
        name: config.title,
        description: config.description,
        config,
        createdById: userId, // In real app, auth handles this
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

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      {/* Sidebar Palette */}
      <div className="w-64 flex-none space-y-6">
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
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight">
              {config.title || "Untitled Report"}
            </h1>
            <p className="text-muted-foreground">{config.description}</p>
          </div>

          {config.widgets.length === 0 ? (
            <div className="flex h-80 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 text-muted-foreground">
              <FileText className="mb-4 h-16 w-16 opacity-20" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Start Building Your Report
              </h3>
              <p className="mb-6 max-w-sm text-center text-sm">
                Add widgets from the sidebar to create your custom report. You
                can drag to reorder them.
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={config.widgets}
                strategy={verticalListSortingStrategy}
              >
                {config.widgets.map((widget) => (
                  <WidgetCard
                    key={widget.id}
                    widget={widget}
                    onRemove={removeWidget}
                    onUpdate={updateWidget}
                    onDuplicate={duplicateWidget}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}

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
    <div className="flex items-center gap-3 pt-4 border-t border-border mt-4">
      <Label className="text-xs text-muted-foreground uppercase whitespace-nowrap">
        Data Source:
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-[180px]">
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
        <Skeleton className="h-[250px] w-full rounded-lg" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-[180px]" />
        </div>
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

/**
 * Widget card component with drag-and-drop support
 */
function WidgetCard({
  widget,
  onRemove,
  onUpdate,
  onDuplicate,
}: {
  widget: WidgetConfig;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WidgetConfig>) => void;
  onDuplicate: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const [chartData, setChartData] = useState<ChartData>([]);
  const [summaryData, setSummaryData] = useState<
    { label: string; value: string | number }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (widget.type === "stats_summary") {
          // getStatsSummary only supports work_orders, inventory, labor
          if (
            widget.dataSource === "work_orders" ||
            widget.dataSource === "inventory" ||
            widget.dataSource === "labor"
          ) {
            const data = await getStatsSummary(widget.dataSource);
            setSummaryData(data);
          }
        } else if (widget.type === "bar_chart" || widget.type === "pie_chart") {
          let data: ChartData = [];
          if (widget.dataSource === "work_orders") {
            data = await getWorkOrderStats();
          } else if (widget.dataSource === "inventory") {
            data = await getInventoryStats();
          } else if (widget.dataSource === "labor") {
            data = await getLaborStats();
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
  }, [widget.dataSource, widget.type]);

  const handleDataSourceChange = (value: DataSource) => {
    onUpdate(widget.id, { dataSource: value });
  };

  const displayData = chartData.length > 0 ? chartData : MOCK_DATA;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md",
        isDragging && "scale-[1.02] border-primary/50 shadow-lg"
      )}
      {...attributes}
    >
      {/* Widget Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <div
            {...listeners}
            className="cursor-grab hover:text-primary active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <Input
            value={widget.title}
            onChange={(e) => onUpdate(widget.id, { title: e.target.value })}
            className="h-8 w-[200px] border-transparent bg-transparent font-bold hover:border-border focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDuplicate(widget.id)}
            title="Duplicate widget"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onRemove(widget.id)}
            title="Remove widget"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Widget Content Area */}
      <div className="p-6">
        {loading ? (
          <WidgetSkeleton type={widget.type} />
        ) : (
          <>
            {/* Text Block */}
            {widget.type === "text_block" && (
              <Textarea
                placeholder="Enter text content here..."
                className="min-h-[100px] border-dashed"
                value={(widget.filters?.text as string) || ""}
                onChange={(e) =>
                  onUpdate(widget.id, {
                    filters: { ...widget.filters, text: e.target.value },
                  })
                }
              />
            )}

            {/* Bar Chart */}
            {widget.type === "bar_chart" && (
              <div className="space-y-0">
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <DataSourceSelect
                  value={widget.dataSource}
                  onChange={handleDataSourceChange}
                />
              </div>
            )}

            {/* Pie Chart */}
            {widget.type === "pie_chart" && (
              <div className="space-y-0">
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={displayData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {displayData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <DataSourceSelect
                  value={widget.dataSource}
                  onChange={handleDataSourceChange}
                />
              </div>
            )}

            {/* Stats Summary */}
            {widget.type === "stats_summary" && (
              <div className="space-y-0">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {summaryData.length > 0
                    ? summaryData.map((s, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-gradient-to-br from-card to-muted/30 p-4"
                        >
                          <div className="text-2xl font-bold">{s.value}</div>
                          <div className="text-xs font-bold uppercase text-muted-foreground">
                            {s.label}
                          </div>
                        </div>
                      ))
                    : [1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-card p-4"
                        >
                          <div className="text-2xl font-bold">--</div>
                          <div className="text-xs font-bold uppercase text-muted-foreground">
                            Metric {i}
                          </div>
                        </div>
                      ))}
                </div>
                <DataSourceSelect
                  value={widget.dataSource}
                  onChange={handleDataSourceChange}
                />
              </div>
            )}

            {/* Data Table */}
            {widget.type === "data_table" && (
              <div className="space-y-0">
                <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/10">
                  <div className="text-center text-muted-foreground">
                    <TableIcon className="mx-auto mb-2 h-12 w-12 opacity-50" />
                    <p className="font-medium">Data Table Preview</p>
                    <p className="text-xs">
                      Tables are populated with live data on report generation
                    </p>
                  </div>
                </div>
                <DataSourceSelect
                  value={widget.dataSource}
                  onChange={handleDataSourceChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
