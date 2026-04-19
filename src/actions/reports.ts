"use server";

import { db } from "@/db";
import { type ReportTemplate, reportTemplates } from "@/db/schema";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import type { ActionResult } from "@/lib/types/actions";
import {
  type ReportConfigInput,
  reportConfigSchema,
  saveReportTemplateSchema,
} from "@/lib/validations";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type StoredReportTemplate = Omit<ReportTemplate, "config"> & {
  config: ReportConfigInput;
};

function parseStoredTemplate(
  template: ReportTemplate | undefined
): StoredReportTemplate | null {
  if (!template) {
    return null;
  }

  const parsedConfig = reportConfigSchema.safeParse(template.config);
  if (!parsedConfig.success) {
    return null;
  }

  return {
    ...template,
    config: parsedConfig.data,
  };
}

export async function saveReportTemplate(
  data: unknown
): Promise<ActionResult<StoredReportTemplate>> {
  const user = await requirePermission(PERMISSIONS.REPORTS_VIEW);
  const parsed = saveReportTemplateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid report template" };
  }

  const { id, name, description, config } = parsed.data;

  let storedTemplate: ReportTemplate;
  if (id) {
    const existing = await db.query.reportTemplates.findFirst({
      where: eq(reportTemplates.id, id),
    });
    if (!existing) {
      return { success: false, error: "Report template not found" };
    }

    [storedTemplate] = await db
      .update(reportTemplates)
      .set({
        name,
        description,
        config,
        updatedAt: new Date(),
      })
      .where(eq(reportTemplates.id, id))
      .returning();
  } else {
    [storedTemplate] = await db
      .insert(reportTemplates)
      .values({
        name,
        description,
        config,
        createdById: user.id,
      })
      .returning();
  }

  revalidatePath("/reports");
  revalidatePath("/reports/builder");

  const normalizedTemplate = parseStoredTemplate(storedTemplate);
  if (!normalizedTemplate) {
    return { success: false, error: "Saved template is invalid" };
  }

  return { success: true, data: normalizedTemplate };
}

export async function deleteReportTemplate(
  id: string
): Promise<ActionResult<void>> {
  await requirePermission(PERMISSIONS.REPORTS_VIEW);
  await db.delete(reportTemplates).where(eq(reportTemplates.id, id));
  revalidatePath("/reports");
  revalidatePath("/reports/builder");
  return { success: true };
}

export async function getReportTemplates(): Promise<
  ActionResult<StoredReportTemplate[]>
> {
  await requirePermission(PERMISSIONS.REPORTS_VIEW);
  const templates = await db.query.reportTemplates.findMany({
    orderBy: [desc(reportTemplates.updatedAt)],
  });

  return {
    success: true,
    data: templates
      .map((template) => parseStoredTemplate(template))
      .filter(
        (template): template is StoredReportTemplate => template !== null
      ),
  };
}

export async function getReportTemplate(
  id: string
): Promise<ActionResult<StoredReportTemplate>> {
  await requirePermission(PERMISSIONS.REPORTS_VIEW);
  const template = await db.query.reportTemplates.findFirst({
    where: eq(reportTemplates.id, id),
  });

  const normalizedTemplate = parseStoredTemplate(template);
  if (!normalizedTemplate) {
    return { success: false, error: "Report template not found" };
  }

  return { success: true, data: normalizedTemplate };
}
