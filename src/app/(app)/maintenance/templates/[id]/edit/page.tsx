import { getWorkOrderTemplateById } from "@/actions/workOrderTemplates";
import { db } from "@/db";
import { departments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { TemplateForm } from "../../template-form";

async function getData(id: number) {
  const [template, allDepartments, allUsers] = await Promise.all([
    getWorkOrderTemplateById(id),
    db.query.departments.findMany({
      where: eq(departments.isActive, true),
      orderBy: (dept, { asc }) => [asc(dept.name)],
    }),
    db.query.users.findMany({
      where: eq(users.isActive, true),
      orderBy: (user, { asc }) => [asc(user.name)],
    }),
  ]);

  return { template, departments: allDepartments, users: allUsers };
}

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const templateId = Number.parseInt(id, 10);

  if (Number.isNaN(templateId)) {
    notFound();
  }

  const { template, departments, users } = await getData(templateId);

  if (!template) {
    notFound();
  }

  return (
    <TemplateForm
      template={template}
      departments={departments}
      users={users}
    />
  );
}
