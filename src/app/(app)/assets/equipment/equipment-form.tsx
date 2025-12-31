"use client";

import { Button } from "@/components/ui/button";
import { FieldGroup, FormGrid } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectionCard, SelectionGrid } from "@/components/ui/selection-cards";
import type { EquipmentCategory, EquipmentType } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Loader2, Search } from "lucide-react";
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
  {
    value: "operational",
    label: "Operational",
    description: "Equipment is running normally",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    description: "Scheduled maintenance in progress",
  },
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



  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-700">
          {error}
        </div>
      )}

      <FormGrid>
        {/* Equipment Name */}
        <FieldGroup label="Equipment Name" required>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., CNC Machine 01"
          />
        </FieldGroup>

        {/* Asset Code */}
        <FieldGroup
          label="Asset Code"
          required
          description={!isNew ? "Asset code cannot be changed" : undefined}
        >
          <Input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            disabled={!isNew}
            placeholder="e.g., CNC-001"
            className={cn(
              "uppercase tracking-wider font-bold",
              !isNew && "bg-muted cursor-not-allowed"
            )}
          />
        </FieldGroup>

        {/* Equipment Category */}
        <FieldGroup label="Equipment Category">
          <Select
            value={categoryId}
            onValueChange={(val) => {
              setCategoryId(val);
              setTypeId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Category..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.label} ({cat.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        {/* Equipment Type */}
        <FieldGroup
          label="Equipment Type"
          description={
            !categoryId
              ? "Select a category first"
              : "Precise classification for SAP PM alignment"
          }
        >
          <Select value={typeId} onValueChange={setTypeId} disabled={!categoryId}>
            <SelectTrigger className={cn(!categoryId && "bg-muted cursor-not-allowed")}>
              <SelectValue placeholder="Select Type..." />
            </SelectTrigger>
            <SelectContent>
              {filteredTypes.map((t) => (
                <SelectItem key={t.id} value={t.id.toString()}>
                  {t.name} ({t.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        {/* Equipment Model */}
        <FieldGroup
          label="Equipment Model (Optional)"
          description="Linking a model enables BOM and spare parts tracking"
        >
          <Select value={modelId} onValueChange={setModelId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a model..." />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id.toString()}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        {/* Department */}
        <FieldGroup label="Responsible Department" required>
          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Department..." />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        {/* Location */}
        <FieldGroup label="Location" required>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a location..." />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id.toString()}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        {/* Owner */}
        <FieldGroup label="Owner (Optional)">
          <Select value={ownerId} onValueChange={setOwnerId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an owner..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        {/* Parent Asset */}
        <FieldGroup
          label="Parent Asset (Optional)"
          description="Linking establishes a nested relationship in the asset registry"
          className="md:col-span-2"
        >
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
                  <Input
                    type="text"
                    placeholder="Search to find parent asset..."
                    value={parentSearch}
                    onChange={(e) => setParentSearch(e.target.value)}
                    className="pl-10"
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
                          <span className="font-medium">{e.name}</span>
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
        </FieldGroup>
      </FormGrid>

      {/* Status Selection */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          Equipment Status
        </h3>
        <SelectionGrid>
          {STATUS_OPTIONS.map((option) => (
            <SelectionCard
              key={option.value}
              label={option.label}
              description={option.description}
              selected={status === option.value}
              onClick={() => setStatus(option.value)}
            />
          ))}
        </SelectionGrid>
      </div>

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
