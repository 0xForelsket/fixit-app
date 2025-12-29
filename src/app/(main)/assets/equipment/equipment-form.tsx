"use client";

import { Button } from "@/components/ui/button";
import type { EquipmentCategory, EquipmentType } from "@/db/schema";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

interface EquipmentFormProps {
  equipment?: {
    id: number;
    name: string;
    code: string;
    status: string;
    locationId: number;
    ownerId: number | null;
    modelId: number | null;
    typeId: number | null;
    type?: {
      categoryId: number;
    } | null;
    parentId: number | null;
  };
  locations: { id: number; name: string }[];
  users: { id: number; name: string }[];
  models: { id: number; name: string }[];
  categories: EquipmentCategory[];
  types: EquipmentType[];
  equipmentList?: { id: number; name: string; code: string }[];
  isNew?: boolean;
}

export function EquipmentForm({
  equipment,
  locations,
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
  const [modelId, setModelId] = useState(equipment?.modelId?.toString() || "");

  const [categoryId, setCategoryId] = useState(
    equipment?.type?.categoryId?.toString() || ""
  );
  const [typeId, setTypeId] = useState(equipment?.typeId?.toString() || "");
  const [parentId, setParentId] = useState(equipment?.parentId?.toString() || searchParams.get("parentId") || "");
  const [parentSearch, setParentSearch] = useState("");

  const filteredTypes = useMemo(() => {
    if (!categoryId) return [];
    return types.filter(
      (t: EquipmentType) => t.categoryId === Number.parseInt(categoryId)
    );
  }, [categoryId, types]);

  const filteredParents = useMemo(() => {
    return equipmentList.filter((e) => {
      const matchesSearch = e.name.toLowerCase().includes(parentSearch.toLowerCase()) || 
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this equipment?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/equipment/${equipment?.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete equipment");
      }

      router.push("/assets/equipment");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" asChild>
            <Link href="/assets/equipment">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "New Equipment" : "Edit Equipment"}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? "Add a new equipment to the fleet" : equipment?.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Equipment"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Equipment Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Printer 01"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="code" className="mb-1 block text-sm font-medium">
              Asset Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="e.g. PR-01"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="mb-1 block text-sm font-medium text-primary-700 uppercase tracking-tight"
            >
              Equipment Category (SAP)
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setTypeId(""); // Reset type when category changes
              }}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
            >
              <option value="">Select Category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} ({cat.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="type"
              className="mb-1 block text-sm font-medium text-primary-700 uppercase tracking-tight"
            >
              Equipment Type (Object Type)
            </label>
            <select
              id="type"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              disabled={!categoryId}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 disabled:bg-zinc-50 disabled:text-zinc-400"
            >
              <option value="">Select Type...</option>
              {filteredTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-zinc-400 font-medium">
              {!categoryId
                ? "Select a category first"
                : "Precise classification for SAP PM alignment"}
            </p>
          </div>

          <div>
            <label htmlFor="model" className="mb-1 block text-sm font-medium">
              Equipment Model
            </label>
            <select
              id="model"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Select a model...</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Linking a model enables BOM and spare parts tracking.
            </p>
          </div>

          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="operational">Operational</option>
              <option value="down">Down</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="location"
              className="mb-1 block text-sm font-medium"
            >
              Location
            </label>
            <select
              id="location"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Select a location...</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="owner" className="mb-1 block text-sm font-medium">
              Owner
            </label>
            <select
              id="owner"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Select an owner...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="parent" className="mb-1 block text-sm font-medium">
              Parent Asset
            </label>
            <div className="space-y-2">
              {activeParent && (
                <div className="flex items-center justify-between rounded-lg border border-primary-100 bg-primary-50/50 px-3 py-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary-600 uppercase">Currently Linked To</span>
                    <span className="font-bold text-zinc-900">{activeParent.name} ({activeParent.code})</span>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] font-black hover:bg-primary-100"
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
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search to find parent asset..."
                      value={parentSearch}
                      onChange={(e) => setParentSearch(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 pl-9 pr-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                    />
                  </div>
                  
                  {parentSearch.length > 0 && (
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-sm divide-y divide-zinc-50">
                      {filteredParents.length > 0 ? (
                        filteredParents.slice(0, 10).map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => {
                              setParentId(e.id.toString());
                              setParentSearch("");
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center justify-between group"
                          >
                            <span className="font-medium text-zinc-900">{e.name}</span>
                            <span className="text-[10px] font-mono text-zinc-400 group-hover:text-primary-600">{e.code}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-xs text-zinc-400">
                          No matching assets found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground italic">
              Linking establishes a nested relationship in the asset registry.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
