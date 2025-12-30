"use client";

import { Button } from "@/components/ui/button";
import type { SparePart, Vendor } from "@/db/schema";
import { cn } from "@/lib/utils";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const categories = [
  "electrical",
  "mechanical",
  "hydraulic",
  "pneumatic",
  "consumable",
  "safety",
  "tooling",
  "other",
] as const;

interface PartFormProps {
  part?: SparePart;
  isNew?: boolean;
  vendors?: Vendor[];
}

export function PartForm({ part, isNew, vendors = [] }: PartFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(part?.name || "");
  const [sku, setSku] = useState(part?.sku || "");
  const [barcode, setBarcode] = useState(part?.barcode || "");
  const [description, setDescription] = useState(part?.description || "");
  const [category, setCategory] = useState<(typeof categories)[number]>(
    part?.category || "other"
  );
  const [unitCost, setUnitCost] = useState(part?.unitCost?.toString() || "");
  const [reorderPoint, setReorderPoint] = useState(
    part?.reorderPoint?.toString() || "0"
  );
  const [leadTimeDays, setLeadTimeDays] = useState(
    part?.leadTimeDays?.toString() || ""
  );
  const [vendorId, setVendorId] = useState(part?.vendorId?.toString() || "");
  const [isActive, setIsActive] = useState(part?.isActive ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name,
        sku,
        barcode: barcode || null,
        description: description || null,
        category,
        unitCost: unitCost ? Number.parseFloat(unitCost) : null,
        reorderPoint: Number.parseInt(reorderPoint) || 0,
        leadTimeDays: leadTimeDays ? Number.parseInt(leadTimeDays) : null,
        vendorId: vendorId ? Number.parseInt(vendorId) : null,
        isActive,
      };

      const url = isNew
        ? "/api/inventory/parts"
        : `/api/inventory/parts/${part?.id}`;

      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save part");
      }

      router.push("/assets/inventory/parts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this part?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/inventory/parts/${part?.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete part");
      }

      router.push("/assets/inventory/parts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" asChild>
            <Link href="/assets/inventory/parts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "New Part" : "Edit Part"}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? "Add a new spare part to inventory" : part?.name}
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
            {saving ? "Saving..." : "Save Part"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* Part Details */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Part Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Bearing 6205"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label htmlFor="sku" className="mb-1 block text-sm font-medium">
              SKU
            </label>
            <input
              id="sku"
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
              placeholder="e.g., BRG-6205-2RS"
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label htmlFor="barcode" className="mb-1 block text-sm font-medium">
              Barcode (optional)
            </label>
            <input
              id="barcode"
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan or enter barcode"
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="mb-1 block text-sm font-medium"
            >
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as (typeof categories)[number])
              }
              className="w-full rounded-lg border px-3 py-2 text-sm capitalize focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium"
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Part description, specifications, etc."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label htmlFor="vendor" className="mb-1 block text-sm font-medium">
              Vendor (optional)
            </label>
            <select
              id="vendor"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">Select a vendor...</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name} ({vendor.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Settings */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Inventory Settings</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="unitCost"
              className="mb-1 block text-sm font-medium"
            >
              Unit Cost ($)
            </label>
            <input
              id="unitCost"
              type="number"
              step="0.01"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="reorderPoint"
              className="mb-1 block text-sm font-medium"
            >
              Reorder Point
            </label>
            <input
              id="reorderPoint"
              type="number"
              min="0"
              value={reorderPoint}
              onChange={(e) => setReorderPoint(e.target.value)}
              placeholder="Minimum stock level"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="leadTime"
              className="mb-1 block text-sm font-medium"
            >
              Lead Time (days)
            </label>
            <input
              id="leadTime"
              type="number"
              min="0"
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(e.target.value)}
              placeholder="Days to restock"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="flex items-center gap-3 md:col-span-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={cn(
                "flex h-6 w-11 items-center rounded-full p-1 transition-colors",
                isActive ? "bg-primary-600" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "h-4 w-4 rounded-full bg-white shadow transition-transform",
                  isActive && "translate-x-5"
                )}
              />
            </button>
            <span className="text-sm font-medium">Active</span>
          </div>
        </div>
      </div>
    </form>
  );
}
