"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface MachineFormProps {
  machine?: {
    id: number;
    name: string;
    code: string;
    status: string;
    locationId: number;
    ownerId: number | null;
    modelId: number | null;
  };
  locations: { id: number; name: string }[];
  users: { id: number; name: string }[];
  models: { id: number; name: string }[];
  isNew?: boolean;
}

export function MachineForm({
  machine,
  locations,
  users,
  models,
  isNew,
}: MachineFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(machine?.name || "");
  const [code, setCode] = useState(machine?.code || "");
  const [status, setStatus] = useState(machine?.status || "operational");
  const [locationId, setLocationId] = useState(
    machine?.locationId?.toString() || ""
  );
  const [ownerId, setOwnerId] = useState(machine?.ownerId?.toString() || "");
  const [modelId, setModelId] = useState(machine?.modelId?.toString() || "");

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
      };

      const url = isNew ? "/api/machines" : `/api/machines/${machine?.id}`;

      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save machine");
      }

      router.push("/admin/machines");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this machine?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/machines/${machine?.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete machine");
      }

      router.push("/admin/machines");
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
            <Link href="/admin/machines">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "New Machine" : "Edit Machine"}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? "Add a new machine to the fleet" : machine?.name}
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
            {saving ? "Saving..." : "Save Machine"}
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
              Machine Name
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
            <label htmlFor="model" className="mb-1 block text-sm font-medium">
              Model
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
        </div>
      </div>
    </form>
  );
}
