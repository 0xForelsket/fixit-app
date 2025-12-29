import { createRole } from "@/actions/roles";
import { Shield } from "lucide-react";
import { RoleForm } from "../role-form";

export default function NewRolePage() {
  return (
    <div className="space-y-10 animate-in">
      <div className="flex flex-col gap-1 border-b border-zinc-200 pb-8">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 uppercase">
          Create <span className="text-primary-600">Role</span>
        </h1>
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
          <Shield className="h-3.5 w-3.5" />
          DEFINE PERMISSIONS FOR NEW ROLE
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-zinc-200/20">
        <RoleForm mode="create" onSubmit={createRole} />
      </div>
    </div>
  );
}
