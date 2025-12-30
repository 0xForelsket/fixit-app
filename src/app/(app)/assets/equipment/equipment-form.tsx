"use client";

import { Button } from "@/components/ui/button";
import type { EquipmentCategory, EquipmentType } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Check, Loader2, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

interface EquipmentFormProps {
  equipment?: {
    id: number;
    name: string;
    code: string;
    status: string;
    locationId: number;
    ownerId: number | null;
    departmentId: number | null;
    modelId: number | null;
    typeId: number | null;
    type?: {
      categoryId: number;
    } | null;
    parentId: number | null;
  };
  locations: { id: number; name: string }[];
  departments: { id: number; name: string }[];
  users: { id: number; name: string }[];
  models: { id: number; name: string }[];
  categories: EquipmentCategory[];
  types: EquipmentType[];
  equipmentList?: { id: number; name: string; code: string }[];
  isNew?: boolean;
}

const STATUS_OPTIONS = [
  { value: "operational", label: "Operational", description: "Equipment is running normally" },
  { value: "maintenance", label: "Maintenance", description: "Scheduled maintenance in progress" },
  { value: "down", label: "Down", description: "Equipment is non-functional" },
];

export function EquipmentForm({
  equipment,
  locations,
  departments,
  users,
  models,
  categories,
  types,
  equipmentList = [],
  isNew,
}: EquipmentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(equipment?.name || "");
  const [code, setCode] = useState(equipment?.code || "");
  const [status, setStatus] = useState(equipment?.status || "operational");
  const [locationId, setLocationId] = useState(
    equipment?.locationId?.toString() || searchParams.get("locationId") || ""
  );
  const [ownerId, setOwnerId] = useState(equipment?.ownerId?.toString() || "");
  const [departmentId, setDepartmentId] = useState(
    equipment?.departmentId?.toString() || ""
  );
  const [modelId, setModelId] = useState(equipment?.modelId?.toString() || "");

  const [categoryId, setCategoryId] = useState(
    equipment?.type?.categoryId?.toString() || ""
  );
  const [typeId, setTypeId] = useState(equipment?.typeId?.toString() || "");
  const [parentId, setParentId] = useState(
    equipment?.parentId?.toString() || searchParams.get("parentId") || ""
  );
  const [parentSearch, setParentSearch] = useState("");

  const filteredTypes = useMemo(() => {
    if (!categoryId) return [];
    return types.filter(
      (t: EquipmentType) => t.categoryId === Number.parseInt(categoryId)
    );
  }, [categoryId, types]);

  const filteredParents = useMemo(() => {
    return equipmentList.filter((e) => {
      const matchesSearch =
        e.name.toLowerCase().includes(parentSearch.toLowerCase()) ||
        e.code.toLowerCase().includes(parentSearch.toLowerCase());
      const isNotSelf = e.id !== equipment?.id;
      return matchesSearch && isNotSelf;
    });
  }, [equipmentList, parentSearch, equipment?.id]);

  const activeParent = useMemo(() => {
    return equipmentList.find((e) => e.id.toString() === parentId);
  }, [equipmentList, parentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name,
        code,
        status,
        locationId: Number.parseInt(locationId),
        ownerId: ownerId ? Number.parseInt(ownerId) : null,
        departmentId: departmentId ? Number.parseInt(departmentId) : null,
        modelId: modelId ? Number.parseInt(modelId) : null,
        typeId: typeId ? Number.parseInt(typeId) : null,
        parentId: parentId ? Number.parseInt(parentId) : null,
      };

      const url = isNew ? "/api/equipment" : `/api/equipment/${equipment?.id}`;

      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save equipment");
      }

      router.push("/assets/equipment");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // Shared input class for consistency
  const inputClass = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all";
  const selectClass = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all";
  const labelClass = "text-[11px] font-black uppercase tracking-widest text-muted-foreground";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Equipment Name */}
        <div className="space-y-2">
          <label htmlFor="name" className={labelClass}>
            Equipment Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., CNC Machine 01"
            className={inputClass}
          />
        </div>

        {/* Asset Code */}
        <div className="space-y-2">
          <label htmlFor="code" className={labelClass}>
            Asset Code
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            disabled={!isNew}
            placeholder="e.g., CNC-001"
            className={cn(
              inputClass,
              "uppercase tracking-wider font-bold",
              !isNew && "bg-muted cursor-not-allowed"
            )}
          />
          {!isNew && (
            <p className="text-[10px] text-muted-foreground">
              Asset code cannot be changed
            </p>
          )}
        </div>

        {/* Equipment Category */}
        <div className="space-y-2">
          <label htmlFor="category" className={labelClass}>
            Equipment Category
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setTypeId("");
            }}
            className={selectClass}
          >
            <option value="">Select Category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label} ({cat.name})
              </option>
            ))}
          </select>
        </div>

        {/* Equipment Type */}
        <div className="space-y-2">
          <label htmlFor="type" className={labelClass}>
            Equipment Type
          </label>
          <select
            id="type"
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            disabled={!categoryId}
            className={cn(selectClass, !categoryId && "bg-muted cursor-not-allowed")}
          >
            <option value="">Select Type...</option>
            {filteredTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.code})
              </option>
            ))}
          </select>
          <p className="text-[10px] text-muted-foreground">
            {!categoryId ? "Select a category first" : "Precise classification for SAP PM alignment"}
          </p>
        </div>

        {/* Equipment Model */}
        <div className="space-y-2">
          <label htmlFor="model" className={cn(labelClass)}>
            Equipment Model (Optional)
          </label>
          <select
            id="model"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className={selectClass}
          >
            <option value="">Select a model...</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-muted-foreground">
            Linking a model enables BOM and spare parts tracking
          </p>
        </div>

        {/* Department */}
        <div className="space-y-2">
          <label htmlFor="department" className={labelClass}>
            Responsible Department
          </label>
          <select
            id="department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
            className={selectClass}
          >
            <option value="">Select Department...</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label htmlFor="location" className={labelClass}>
            Location
          </label>
          <select
            id="location"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            required
            className={selectClass}
          >
            <option value="">Select a location...</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Owner */}
        <div className="space-y-2">
          <label htmlFor="owner" className={labelClass}>
            Owner (Optional)
          </label>
          <select
            id="owner"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className={selectClass}
          >
            <option value="">Select an owner...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Parent Asset */}
        <div className="space-y-2 md:col-span-2">
          <label className={labelClass}>
            Parent Asset (Optional)
          </label>
          <div className="space-y-2">
            {activeParent && (
              <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-primary uppercase">
                    Currently Linked To
                  </span>
                  <span className="font-bold">
                    {activeParent.name} ({activeParent.code})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] font-black hover:bg-primary/10"
                  onClick={() => {
                    setParentId("");
                    setParentSearch("");
                  }}
                >
                  DETACH
                </Button>
              </div>
            )}

            {!activeParent && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search to find parent asset..."
                    value={parentSearch}
                    onChange={(e) => setParentSearch(e.target.value)}
                    className={cn(inputClass, "pl-10")}
                  />
                </div>

                {parentSearch.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
                    {filteredParents.length > 0 ? (
                      filteredParents.slice(0, 10).map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => {
                            setParentId(e.id.toString());
                            setParentSearch("");
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center justify-between group transition-colors"
                        >
                          <span className="font-medium">
                            {e.name}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground group-hover:text-primary">
                            {e.code}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-center text-xs text-muted-foreground">
                        No matching assets found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Linking establishes a nested relationship in the asset registry
          </p>
        </div>
      </div>

      {/* Status Selection */}
      <fieldset className="space-y-4">
        <legend className={labelClass}>
          Equipment Status
        </legend>
        <div className="grid gap-3 md:grid-cols-3">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                status === option.value
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                  status === option.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                )}
              >
                {status === option.value && <Check className="h-3 w-3" />}
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-wide">
                  {option.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/assets/equipment")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isNew ? "Create Equipment" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

