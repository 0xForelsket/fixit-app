import { getAllRoles, getUserById, updateUser } from "@/actions/users";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteUserButton } from "../delete-user-button";
import { UserForm } from "../user-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = await params;

  const [user, roles] = await Promise.all([getUserById(userId), getAllRoles()]);

  if (!user) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    const result = await updateUser(userId, formData);
    if (result.success) {
      return { success: true as const };
    }
    return result;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white transition-colors hover:bg-zinc-50"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-muted-foreground font-mono">{user.employeeId}</p>
          </div>
        </div>
        <DeleteUserButton userId={user.id} userName={user.name} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <UserForm
          mode="edit"
          roles={roles}
          initialData={{
            id: user.id,
            employeeId: user.employeeId,
            name: user.name,
            email: user.email,
            roleId: user.roleId,
            isActive: user.isActive,
            hourlyRate: user.hourlyRate,
          }}
          onSubmit={handleUpdate}
        />
      </div>
    </div>
  );
}
