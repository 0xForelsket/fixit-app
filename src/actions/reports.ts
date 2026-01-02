"use server";

import { db } from "@/db";
import { reportTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ReportConfigSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  widgets: z.array(z.any()), // Validate more strictly if needed
});

const SaveTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  config: ReportConfigSchema,
  createdById: z.string(),
});

export async function saveReportTemplate(data: z.infer<typeof SaveTemplateSchema>) {
  const { id, name, description, config, createdById } = data;

  if (id) {
    // Update existing
    await db
      .update(reportTemplates)
      .set({
        name,
        description,
        config: config as any,
        updatedAt: new Date(),
      })
      .where(eq(reportTemplates.id, id));
  } else {
    // Create new
    await db.insert(reportTemplates).values({
      name,
      description,
      config: config as any,
      createdById,
    });
  }

  revalidatePath("/reports");
  revalidatePath("/reports/builder");
}

export async function deleteReportTemplate(id: string) {
  await db.delete(reportTemplates).where(eq(reportTemplates.id, id));
  revalidatePath("/reports");
}

export async function getReportTemplates() {
  return await db.select().from(reportTemplates);
}

export async function getReportTemplate(id: string) {
  return await db.query.reportTemplates.findFirst({
    where: eq(reportTemplates.id, id),
  });
}
