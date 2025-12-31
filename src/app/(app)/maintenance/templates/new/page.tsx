import { db } from "@/db";
import { departments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TemplateForm } from "../template-form";

async function getData() {
  const [allDepartments, allUsers] = await Promise.all([
    db.query.departments.findMany({
      where: eq(departments.isActive, true),
      orderBy: (dept, { asc }) => [asc(dept.name)],
    }),
    db.query.users.findMany({
      where: eq(users.isActive, true),
      orderBy: (user, { asc }) => [asc(user.name)],
    }),
  ]);

  return { departments: allDepartments, users: allUsers };
}

export default async function NewTemplatePage() {
  const { departments, users } = await getData();

  return <TemplateForm departments={departments} users={users} isNew />;
}
