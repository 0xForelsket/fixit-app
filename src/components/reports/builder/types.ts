export type WidgetType =
  | "bar_chart"
  | "pie_chart"
  | "stats_summary"
  | "data_table"
  | "text_block";

export type DataSource = "work_orders" | "inventory" | "labor" | "equipment";

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
}

export interface ReportConfig {
  title: string;
  description?: string;
  widgets: WidgetConfig[];
}
