import { createUser, getAllRoles } from "@/actions/users";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { UserForm } from "../user-form";

export default async function NewUserPage() {
  const roles = await getAllRoles();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white transition-colors hover:bg-zinc-50"
        >
          <ArrowLeft className="h-5 w-5 text-zinc-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New User</h1>
          <p className="text-muted-foreground">
            Add a new employee to the system
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <UserForm mode="create" roles={roles} onSubmit={createUser} />
      </div>
    </div>
  );
}
