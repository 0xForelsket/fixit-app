export type WidgetType =
  | "bar_chart"
  | "pie_chart"
  | "stats_summary"
  | "data_table"
  | "text_block";

export type DataSource = "work_orders" | "inventory" | "labor" | "equipment";

export type DateRangePreset =
  | "today"
  | "7d"
  | "30d"
  | "month"
  | "quarter"
  | "year"
  | "custom";

export interface DateRangeFilter {
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  preset?: DateRangePreset;
}

export interface WidgetLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: DataSource;
  filters?: Record<string, string | number | boolean>;
  layout: WidgetLayout;
  dateRange?: DateRangeFilter;
}

export interface ReportConfig {
  title: string;
  description?: string;
  widgets: WidgetConfig[];
  globalDateRange?: DateRangeFilter;
}
