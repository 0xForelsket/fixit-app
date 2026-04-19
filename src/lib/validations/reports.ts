import { z } from "zod";

export const reportWidgetTypeSchema = z.enum([
  "bar_chart",
  "pie_chart",
  "stats_summary",
  "data_table",
  "text_block",
]);

export const reportDataSourceSchema = z.enum([
  "work_orders",
  "inventory",
  "labor",
  "equipment",
]);

export const reportDateRangePresetSchema = z.enum([
  "today",
  "7d",
  "30d",
  "month",
  "quarter",
  "year",
  "custom",
]);

export const reportDateRangeFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  preset: reportDateRangePresetSchema.optional(),
});

const reportWidgetLayoutSchema = z.object({
  id: z.string().min(1),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
});

const widgetFilterValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const reportWidgetConfigSchema = z.object({
  id: z.string().min(1),
  type: reportWidgetTypeSchema,
  title: z.string().min(1).max(200),
  dataSource: reportDataSourceSchema,
  filters: z.record(widgetFilterValueSchema).optional(),
  layout: reportWidgetLayoutSchema,
  dateRange: reportDateRangeFilterSchema.optional(),
});

export const reportConfigSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  widgets: z.array(reportWidgetConfigSchema),
  globalDateRange: reportDateRangeFilterSchema.optional(),
});

export const saveReportTemplateSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  config: reportConfigSchema,
});

export const reportWidgetDataQuerySchema = z.object({
  widgetType: z.enum(["bar_chart", "pie_chart", "stats_summary"]),
  dataSource: z.enum(["work_orders", "inventory", "labor"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ReportConfigInput = z.infer<typeof reportConfigSchema>;
export type ReportWidgetDataQuery = z.infer<typeof reportWidgetDataQuerySchema>;
