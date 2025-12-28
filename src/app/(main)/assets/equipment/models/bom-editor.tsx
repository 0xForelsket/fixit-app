"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EquipmentBom, SparePart } from "@/db/schema";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface BomEditorProps {
  modelId: number;
  items: (EquipmentBom & { part: SparePart })[];
  parts: SparePart[]; // All available parts for selection
}

export function BomEditor({ modelId, items, parts }: BomEditorProps) {
  const router = useRouter();
  const [selectedPartId, setSelectedPartId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Filter out parts already in BOM? Or allow updating?
  // Let's allow simple selection. If already in BOM, maybe warn or select existing?
  // For simplicity, just list all.

  const handleAdd = async () => {
    if (!selectedPartId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/equipment/models/${modelId}/bom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId: Number.parseInt(selectedPartId),
          quantityRequired: quantity,
          notes,
        }),
      });

      if (!res.ok) throw new Error("Failed to add part");

      router.refresh();
      // Reset form
      setSelectedPartId("");
      setQuantity(1);
      setNotes("");
    } catch (error) {
      console.error(error);
      alert("Failed to add part to BOM");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bomId: number) => {
    if (!confirm("Remove this part from BOM?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/equipment/models/${modelId}/bom/${bomId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove part");

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to remove part");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-lg">Bill of Materials (BOM)</h2>
      <p className="text-sm text-muted-foreground">
        Define spare parts recommended for this equipment model.
      </p>

      {/* Add Part Form */}
      <div className="flex flex-col gap-4 rounded-lg bg-slate-50 p-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label
            htmlFor="part-select"
            className="mb-1 block text-sm font-medium"
          >
            Part
          </label>
          <select
            id="part-select"
            value={selectedPartId}
            onChange={(e) => setSelectedPartId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Select a part...</option>
            {parts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>
        <div className="w-24">
          <label htmlFor="qty-input" className="mb-1 block text-sm font-medium">
            Qty
          </label>
          <input
            id="qty-input"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number.parseInt(e.target.value))}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="notes-input"
            className="mb-1 block text-sm font-medium"
          >
            Notes
          </label>
          <input
            id="notes-input"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Critical for Y-axis"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <Button onClick={handleAdd} disabled={!selectedPartId || loading}>
          <Plus className="mr-2 h-4 w-4" />
          Add Part
        </Button>
      </div>

      {/* BOM List */}
      <div className="rounded-lg border">
        <Table className="w-full text-sm">
          <TableHeader className="bg-slate-50">
            <TableRow className="text-left font-medium text-muted-foreground">
              <TableHead className="p-3">Part Name</TableHead>
              <TableHead className="p-3">SKU</TableHead>
              <TableHead className="p-3">Required Qty</TableHead>
              <TableHead className="p-3">Notes</TableHead>
              <TableHead className="p-3 w-10" />
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y">
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="p-8 text-center text-muted-foreground"
                >
                  No parts defined in BOM yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="p-3 font-medium">{item.part.name}</TableCell>
                  <TableCell className="p-3">{item.part.sku}</TableCell>
                  <TableCell className="p-3">{item.quantityRequired}</TableCell>
                  <TableCell className="p-3 text-muted-foreground">{item.notes}</TableCell>
                  <TableCell className="p-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => handleDelete(item.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
