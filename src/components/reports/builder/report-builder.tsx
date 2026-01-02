"use client";

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

import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  FileText,
  GripVertical,
  LayoutGrid,
  PieChart as PieChartIcon,
  Save,
  Table as TableIcon,
  Trash2,
  Type,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { ReportConfig, WidgetConfig, WidgetType } from "./types";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { getWorkOrderStats, getInventoryStats, getLaborStats, getStatsSummary, type ChartData } from "@/actions/analytics";
import { useEffect } from "react";
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
      widgets: prev.widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    }));
  };

  const removeWidget = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== id),
    }));
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
                  setConfig((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
            <Button className="w-full font-bold" onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "SAVING..." : "SAVE TEMPLATE"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 overflow-y-auto rounded-2xl border-2 border-dashed border-border/50 bg-muted/20 p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="text-center mb-8">
             <h1 className="text-3xl font-black tracking-tight">{config.title || "Untitled Report"}</h1>
             <p className="text-muted-foreground">{config.description}</p>
          </div>

          {config.widgets.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-border bg-card/50 text-muted-foreground">
              <FileText className="mb-4 h-12 w-12 opacity-20" />
              <p>Drag components here or click to add them</p>
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
                {config.widgets.map((widget, index) => (
                  <WidgetCard
                    key={widget.id}
                    widget={widget}
                    index={index}
                    total={config.widgets.length}
                    onRemove={removeWidget}
                    onUpdate={updateWidget}
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


// ... imports

function WidgetCard({
  widget,
  onRemove,
  onUpdate,
}: {
  widget: WidgetConfig;
  index: number; // kept for compatibility if needed, but unused
  total: number; // kept for compatibility if needed, but unused
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WidgetConfig>) => void;
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
  const [summaryData, setSummaryData] = useState<{ label: string; value: string | number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (widget.type === "stats_summary") {
           if (widget.dataSource === "work_orders" || widget.dataSource === "inventory" || widget.dataSource === "labor") {
               const data = await getStatsSummary(widget.dataSource);
               setSummaryData(data);
           }
        } else if (widget.type === "bar_chart" || widget.type === "pie_chart") {
           let data: ChartData = [];
           if (widget.dataSource === "work_orders") data = await getWorkOrderStats();
           else if (widget.dataSource === "inventory") data = await getInventoryStats();
           else if (widget.dataSource === "labor") data = await getLaborStats();
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md",
        isDragging && "shadow-lg scale-[1.02] border-primary/50"
      )}
      {...attributes}
    >
      {/* Widget Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <div {...listeners} className="cursor-grab hover:text-primary active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <Input
            value={widget.title}
            onChange={(e) => onUpdate(widget.id, { title: e.target.value })}
            className="h-8 w-[200px] bg-transparent border-transparent hover:border-border focus:border-primary font-bold"
          />
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onRemove(widget.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Widget Content Area */}
      <div className="p-6">
        {loading ? (
             <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                 Loading data...
             </div>
        ) : (
        <>
        {widget.type === "text_block" && (
           <Textarea
             placeholder="Enter text content here..."
             className="min-h-[100px] border-dashed"
             value={widget.filters?.text as string || ""}
             onChange={(e) => onUpdate(widget.id, { filters: { ...widget.filters, text: e.target.value } })}
           />
        )}

        {widget.type === "bar_chart" && (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.length > 0 ? chartData : MOCK_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 flex gap-4">
               <Label className="text-xs text-muted-foreground uppercase">Data Source:</Label>
               <Select
                  value={widget.dataSource}
                  onValueChange={(v) => onUpdate(widget.id, { dataSource: v as import("./types").DataSource })}
               >
                 <SelectTrigger className="h-8 w-[180px]">
                    <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="work_orders">Work Orders</SelectItem>
                   <SelectItem value="inventory">Inventory</SelectItem>
                   <SelectItem value="labor">Labor Hours</SelectItem>
                 </SelectContent>
               </Select>
            </div>
          </div>
        )}

        {widget.type === "pie_chart" && (
             <div className="h-[300px] w-full flex flex-col items-center">
               {/* Use BarChart for now as PieChart needs more setup with Cells/Legend which we removed */}
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData.length > 0 ? chartData : MOCK_DATA} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} />
                  </BarChart>
               </ResponsiveContainer>
                <div className="mt-4 flex gap-4">
                   <Label className="text-xs text-muted-foreground uppercase">Data Source:</Label>
                   <Select
                      value={widget.dataSource}
                      onValueChange={(v) => onUpdate(widget.id, { dataSource: v as import("./types").DataSource })}
                   >
                     <SelectTrigger className="h-8 w-[180px]">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="work_orders">Work Orders</SelectItem>
                       <SelectItem value="inventory">Inventory</SelectItem>
                       <SelectItem value="labor">Labor Hours</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
            </div>
        )}

        {widget.type === "stats_summary" && (
             <div className="grid grid-cols-4 gap-4">
                {summaryData.length > 0 ? summaryData.map((s, i) => (
                     <div key={i} className="rounded-lg border border-border bg-card p-4">
                        <div className="text-2xl font-bold">{s.value}</div>
                        <div className="text-xs text-muted-foreground uppercase font-bold">{s.label}</div>
                    </div>
                )) : [1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-lg border border-border bg-card p-4">
                        <div className="text-2xl font-bold">--</div>
                        <div className="text-xs text-muted-foreground uppercase font-bold">Metric {i}</div>
                    </div>
                ))}
            </div>
        )}
        
         {widget.type === "data_table" && (
             <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg bg-muted/10">
                <div className="text-center text-muted-foreground">
                    <TableIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>Data Table ({widget.dataSource})</p>
                    <p className="text-xs">Tables are populated on report generation.</p>
                </div>
            </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
