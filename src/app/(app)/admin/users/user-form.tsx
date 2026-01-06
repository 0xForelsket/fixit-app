"use client";

import { Button } from "@/components/ui/button";
import { FormErrorSummary } from "@/components/ui/form-error-summary";
import type { Role } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SubmitResult =
  | { success: true; data?: { id: string } }
  | { success: false; error: string };

interface UserFormProps {
  mode: "create" | "edit";
  roles: Role[];
  initialData?: {
    id: string;
    employeeId: string;
    name: string;
    email: string | null;
    roleId: string | null;
    isActive: boolean;
    hourlyRate: number | null;
  };
  onSubmit: (formData: FormData) => Promise<SubmitResult>;
}

export function UserForm({
  mode,
  roles,
  initialData,
  onSubmit,
}: UserFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(
    initialData?.roleId ?? null
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("isActive", isActive.toString());
    if (selectedRoleId) {
      formData.set("roleId", selectedRoleId.toString());
    }

    const result = await onSubmit(formData);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "An error occurred");
      return;
    }

    if (mode === "create" && result.data?.id) {
      router.push(`/admin/users/${result.data.id}`);
    } else {
      router.push("/admin/users");
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <FormErrorSummary error={error || undefined} onDismiss={() => setError(null)} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="employeeId"
            className="text-[11px] font-black uppercase tracking-widest text-zinc-500"
          >
            Employee ID
          </label>
          <input
            type="text"
            id="employeeId"
            name="employeeId"
            defaultValue={initialData?.employeeId}
            disabled={mode === "edit"}
            required
            pattern="^[A-Za-z0-9-]+$"
            placeholder="e.g., TECH-001"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold tracking-wider uppercase placeholder:text-zinc-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 disabled:bg-zinc-100 disabled:cursor-not-allowed"
          />
          {mode === "edit" && (
            <p className="text-[10px] text-zinc-400">
              Employee ID cannot be changed
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="name"
            className="text-[11px] font-black uppercase tracking-widest text-zinc-500"
          >
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={initialData?.name}
            required
            placeholder="e.g., John Smith"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium placeholder:text-zinc-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-[11px] font-black uppercase tracking-widest text-zinc-500"
          >
            Email (Optional)
          </label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={initialData?.email ?? ""}
            placeholder="e.g., john@company.com"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium placeholder:text-zinc-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="pin"
            className="text-[11px] font-black uppercase tracking-widest text-zinc-500"
          >
            PIN {mode === "edit" && "(Leave blank to keep current)"}
          </label>
          <input
            type="password"
            id="pin"
            name="pin"
            required={mode === "create"}
            minLength={4}
            maxLength={20}
            placeholder={mode === "create" ? "Enter 4-20 digit PIN" : "••••"}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium placeholder:text-zinc-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="hourlyRate"
            className="text-[11px] font-black uppercase tracking-widest text-zinc-500"
          >
            Hourly Rate (Optional)
          </label>
          <input
            type="number"
            id="hourlyRate"
            name="hourlyRate"
            defaultValue={initialData?.hourlyRate ?? ""}
            min={0}
            step={0.01}
            placeholder="e.g., 25.00"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium placeholder:text-zinc-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
          />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
            Status
          </span>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className="flex items-center gap-3 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3"
          >
            <div
              className={cn(
                "flex h-6 w-11 items-center rounded-full p-1 transition-colors",
                isActive ? "bg-emerald-500" : "bg-zinc-200"
              )}
            >
              <div
                className={cn(
                  "h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                  isActive && "translate-x-5"
                )}
              />
            </div>
            <span className="text-sm font-medium">
              {isActive ? "Active" : "Inactive"}
            </span>
          </button>
        </div>
      </div>

      <fieldset className="space-y-4">
        <legend className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
          Assign Role
        </legend>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRoleId(role.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                selectedRoleId === role.id
                  ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                  selectedRoleId === role.id
                    ? "border-primary-500 bg-primary-500 text-white"
                    : "border-zinc-300"
                )}
              >
                {selectedRoleId === role.id && <Check className="h-3 w-3" />}
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-wide">
                  {role.name}
                </p>
                {role.description && (
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {role.description}
                  </p>
                )}
                <p className="text-[10px] text-zinc-400 mt-1">
                  {role.permissions.includes("*")
                    ? "All permissions"
                    : `${role.permissions.length} permissions`}
                </p>
              </div>
            </button>
          ))}
        </div>
        {!selectedRoleId && (
          <p className="text-xs text-danger-600">Please select a role</p>
        )}
      </fieldset>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/users")}
          className="font-bold"
        >
          CANCEL
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !selectedRoleId}
          className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold shadow-lg shadow-primary-500/25"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "CREATE USER" : "SAVE CHANGES"}
        </Button>
      </div>
    </form>
  );
}
