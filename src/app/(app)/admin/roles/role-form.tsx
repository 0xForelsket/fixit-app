"use client";

import { Button } from "@/components/ui/button";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Human-readable descriptions for each permission.
 * Displayed in the role form to help admins understand what each permission grants.
 */
const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  // Tickets
  "ticket:create": "Create new maintenance tickets",
  "ticket:view": "View own reported tickets",
  "ticket:view_all": "View all tickets in the system",
  "ticket:update": "Edit ticket details and status",
  "ticket:resolve": "Mark tickets as resolved",
  "ticket:close": "Close resolved tickets",
  "ticket:assign": "Assign tickets to technicians",
  // Equipment
  "equipment:view": "View equipment list and details",
  "equipment:create": "Add new equipment to the system",
  "equipment:update": "Edit equipment details and status",
  "equipment:delete": "Remove equipment from the system",
  "equipment:manage_models": "Create and manage equipment models",
  // Locations
  "location:view": "View facility locations",
  "location:create": "Add new locations",
  "location:update": "Edit location details",
  "location:delete": "Remove locations",
  // Users
  "user:view": "View user list and profiles",
  "user:create": "Add new users",
  "user:update": "Edit user details and roles",
  "user:delete": "Deactivate users",
  // Inventory
  "inventory:view": "View spare parts and stock levels",
  "inventory:create": "Add new spare parts",
  "inventory:update": "Edit part details and reorder points",
  "inventory:delete": "Remove spare parts",
  "inventory:receive_stock": "Record incoming stock deliveries",
  "inventory:use_parts": "Log parts used on tickets",
  // Maintenance
  "maintenance:view": "View maintenance schedules",
  "maintenance:create": "Create preventive maintenance schedules",
  "maintenance:update": "Edit maintenance schedules",
  "maintenance:delete": "Remove maintenance schedules",
  "maintenance:complete_checklist": "Complete maintenance checklists",
  // Analytics & Reports
  "analytics:view": "View dashboard analytics and KPIs",
  "reports:view": "View system reports",
  "reports:export": "Export reports to files",
  // System
  "system:settings": "Modify system settings",
  "system:qr_codes": "Generate and manage QR codes",
  "system:scheduler": "Manage scheduled tasks",
};

const PERMISSION_GROUPS: Record<
  string,
  { label: string; permissions: Permission[] }
> = {
  workOrders: {
    label: "Work Orders",
    permissions: [
      PERMISSIONS.TICKET_CREATE,
      PERMISSIONS.TICKET_VIEW,
      PERMISSIONS.TICKET_VIEW_ALL,
      PERMISSIONS.TICKET_UPDATE,
      PERMISSIONS.TICKET_RESOLVE,
      PERMISSIONS.TICKET_CLOSE,
      PERMISSIONS.TICKET_ASSIGN,
    ],
  },
  equipment: {
    label: "Equipment",
    permissions: [
      PERMISSIONS.EQUIPMENT_VIEW,
      PERMISSIONS.EQUIPMENT_CREATE,
      PERMISSIONS.EQUIPMENT_UPDATE,
      PERMISSIONS.EQUIPMENT_DELETE,
      PERMISSIONS.EQUIPMENT_MANAGE_MODELS,
    ],
  },
  locations: {
    label: "Locations",
    permissions: [
      PERMISSIONS.LOCATION_VIEW,
      PERMISSIONS.LOCATION_CREATE,
      PERMISSIONS.LOCATION_UPDATE,
      PERMISSIONS.LOCATION_DELETE,
    ],
  },
  users: {
    label: "Users",
    permissions: [
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_DELETE,
    ],
  },
  inventory: {
    label: "Inventory",
    permissions: [
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_CREATE,
      PERMISSIONS.INVENTORY_UPDATE,
      PERMISSIONS.INVENTORY_DELETE,
      PERMISSIONS.INVENTORY_RECEIVE_STOCK,
      PERMISSIONS.INVENTORY_USE_PARTS,
    ],
  },
  maintenance: {
    label: "Maintenance",
    permissions: [
      PERMISSIONS.MAINTENANCE_VIEW,
      PERMISSIONS.MAINTENANCE_CREATE,
      PERMISSIONS.MAINTENANCE_UPDATE,
      PERMISSIONS.MAINTENANCE_DELETE,
      PERMISSIONS.MAINTENANCE_COMPLETE_CHECKLIST,
    ],
  },
  analytics: {
    label: "Analytics & Reports",
    permissions: [
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
    ],
  },
  system: {
    label: "System",
    permissions: [
      PERMISSIONS.SYSTEM_SETTINGS,
      PERMISSIONS.SYSTEM_QR_CODES,
      PERMISSIONS.SYSTEM_SCHEDULER,
    ],
  },
};

function getPermissionLabel(permission: string): string {
  const [, action] = permission.split(":");
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getPermissionDescription(permission: string): string | undefined {
  return PERMISSION_DESCRIPTIONS[permission];
}

type SubmitResult =
  | { success: true; data?: { id: string } | undefined }
  | { success: false; error: string };

interface RoleFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
    isSystemRole: boolean;
  };
  onSubmit: (formData: FormData) => Promise<SubmitResult>;
}

export function RoleForm({ mode, initialData, onSubmit }: RoleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(initialData?.permissions ?? [])
  );
  const [grantAll, setGrantAll] = useState(
    initialData?.permissions.includes("*") ?? false
  );

  const isSystemRole = initialData?.isSystemRole ?? false;

  function togglePermission(permission: string) {
    if (isSystemRole) return;
    const newSet = new Set(selectedPermissions);
    if (newSet.has(permission)) {
      newSet.delete(permission);
    } else {
      newSet.add(permission);
    }
    setSelectedPermissions(newSet);
  }

  function toggleGroup(permissions: Permission[]) {
    if (isSystemRole) return;
    const allSelected = permissions.every((p) => selectedPermissions.has(p));
    const newSet = new Set(selectedPermissions);
    if (allSelected) {
      for (const p of permissions) newSet.delete(p);
    } else {
      for (const p of permissions) newSet.add(p);
    }
    setSelectedPermissions(newSet);
  }

  function handleGrantAllChange() {
    if (isSystemRole) return;
    setGrantAll(!grantAll);
    if (!grantAll) {
      setSelectedPermissions(new Set(["*"]));
    } else {
      setSelectedPermissions(new Set());
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    formData.delete("permissions");
    for (const perm of selectedPermissions) {
      formData.append("permissions", perm);
    }

    const result = await onSubmit(formData);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "An error occurred");
      return;
    }

    if (mode === "create" && result.data?.id) {
      router.push(`/admin/roles/${result.data.id}`);
    } else {
      router.push("/admin/roles");
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-700">
          {error}
        </div>
      )}

      {isSystemRole && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700">
          This is a system role and cannot be modified.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="text-[11px] font-black uppercase tracking-widest text-zinc-500"
          >
            Role Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={initialData?.name}
            disabled={isSystemRole}
            required
            pattern="^[a-z0-9_-]+$"
            placeholder="e.g., supervisor"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold tracking-wider placeholder:text-zinc-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 disabled:bg-zinc-100 disabled:cursor-not-allowed"
          />
          <p className="text-[10px] text-zinc-400">
            Lowercase letters, numbers, hyphens, underscores only
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="text-[11px] font-black uppercase tracking-widest text-zinc-500"
          >
            Description
          </label>
          <input
            type="text"
            id="description"
            name="description"
            defaultValue={initialData?.description ?? ""}
            disabled={isSystemRole}
            placeholder="Brief description of this role"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium placeholder:text-zinc-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 disabled:bg-zinc-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
            Permissions
          </h2>
          <label
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              isSystemRole && "cursor-not-allowed opacity-50"
            )}
          >
            <input
              type="checkbox"
              checked={grantAll}
              onChange={handleGrantAllChange}
              disabled={isSystemRole}
              className="sr-only"
            />
            <div
              className={cn(
                "flex h-6 w-11 items-center rounded-full p-1 transition-colors",
                grantAll ? "bg-amber-500" : "bg-zinc-200"
              )}
            >
              <div
                className={cn(
                  "h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                  grantAll && "translate-x-5"
                )}
              />
            </div>
            <span className="text-xs font-bold text-zinc-600">
              Grant All (Superadmin)
            </span>
          </label>
        </div>

        {!grantAll && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(PERMISSION_GROUPS).map(([key, group]) => {
              const allSelected = group.permissions.every((p) =>
                selectedPermissions.has(p)
              );
              const someSelected = group.permissions.some((p) =>
                selectedPermissions.has(p)
              );

              return (
                <div
                  key={key}
                  className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3"
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.permissions)}
                    disabled={isSystemRole}
                    className={cn(
                      "flex items-center gap-2 text-sm font-black uppercase tracking-wider transition-colors w-full text-left",
                      allSelected
                        ? "text-primary-600"
                        : someSelected
                          ? "text-zinc-600"
                          : "text-zinc-400",
                      isSystemRole && "cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                        allSelected
                          ? "border-primary-500 bg-primary-500 text-white"
                          : someSelected
                            ? "border-primary-300 bg-primary-100"
                            : "border-zinc-300"
                      )}
                    >
                      {allSelected && <Check className="h-3 w-3" />}
                      {someSelected && !allSelected && (
                        <div className="h-2 w-2 rounded-sm bg-primary-400" />
                      )}
                    </div>
                    {group.label}
                  </button>

                  <div className="space-y-1 pl-7">
                    {group.permissions.map((permission) => (
                      <label
                        key={permission}
                        className={cn(
                          "flex items-center gap-2 py-1 cursor-pointer",
                          isSystemRole && "cursor-not-allowed"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.has(permission)}
                          onChange={() => togglePermission(permission)}
                          disabled={isSystemRole}
                          className="sr-only"
                        />
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border transition-colors shrink-0 mt-0.5",
                            selectedPermissions.has(permission)
                              ? "border-primary-500 bg-primary-500 text-white"
                              : "border-zinc-300"
                          )}
                        >
                          {selectedPermissions.has(permission) && (
                            <Check className="h-2.5 w-2.5" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              selectedPermissions.has(permission)
                                ? "text-zinc-900"
                                : "text-zinc-600"
                            )}
                          >
                            {getPermissionLabel(permission)}
                          </span>
                          {getPermissionDescription(permission) && (
                            <span className="text-[10px] text-zinc-400 leading-tight">
                              {getPermissionDescription(permission)}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/roles")}
          className="font-bold"
        >
          CANCEL
        </Button>
        {!isSystemRole && (
          <Button
            type="submit"
            disabled={isSubmitting || selectedPermissions.size === 0}
            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold shadow-lg shadow-primary-500/25"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "CREATE ROLE" : "SAVE CHANGES"}
          </Button>
        )}
      </div>
    </form>
  );
}
