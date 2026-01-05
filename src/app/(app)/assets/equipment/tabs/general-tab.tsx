"use client";

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
import { useMemo } from "react";

interface GeneralTabProps {
  name: string;
  setName: (value: string) => void;
  code: string;
  setCode: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  categoryId: string;
  setCategoryId: (value: string) => void;
  typeId: string;
  setTypeId: (value: string) => void;
  modelId: string;
  setModelId: (value: string) => void;
  categories: EquipmentCategory[];
  types: EquipmentType[];
  models: { id: string; name: string }[];
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

export function GeneralTab({
  name,
  setName,
  code,
  setCode,
  status,
  setStatus,
  categoryId,
  setCategoryId,
  typeId,
  setTypeId,
  modelId,
  setModelId,
  categories,
  types,
  models,
  isNew,
}: GeneralTabProps) {
  const filteredTypes = useMemo(() => {
    if (!categoryId) return [];
    return types.filter((t) => t.categoryId === categoryId);
  }, [categoryId, types]);

  return (
    <div className="space-y-8">
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
                <SelectItem key={cat.id} value={cat.id}>
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
          <Select
            value={typeId}
            onValueChange={setTypeId}
            disabled={!categoryId}
          >
            <SelectTrigger
              className={cn(!categoryId && "bg-muted cursor-not-allowed")}
            >
              <SelectValue placeholder="Select Type..." />
            </SelectTrigger>
            <SelectContent>
              {filteredTypes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
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
          className="md:col-span-2"
        >
          <Select value={modelId} onValueChange={setModelId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a model..." />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    </div>
  );
}
