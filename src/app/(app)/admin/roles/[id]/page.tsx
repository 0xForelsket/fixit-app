import { getRole, updateRole } from "@/actions/roles";
import { Shield } from "lucide-react";
import { notFound } from "next/navigation";
import { RoleForm } from "../role-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRolePage({ params }: PageProps) {
  const { id: roleId } = await params;

  const role = await getRole(roleId);

  if (!role) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    const result = await updateRole(roleId, formData);
    if (!result.success) {
      return { success: false as const, error: result.error };
    }
    return { success: true as const };
  }

  return (
    <div className="space-y-10 animate-in">
      <div className="flex flex-col gap-1 border-b border-zinc-200 pb-8">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 uppercase">
          Edit <span className="text-primary-600">Role</span>
        </h1>
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
          <Shield className="h-3.5 w-3.5" />
          {role.name.toUpperCase()}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-zinc-200/20">
        <RoleForm
          mode="edit"
          initialData={{
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: role.permissions,
            isSystemRole: role.isSystemRole,
          }}
          onSubmit={handleUpdate}
        />
      </div>
    </div>
  );
}
