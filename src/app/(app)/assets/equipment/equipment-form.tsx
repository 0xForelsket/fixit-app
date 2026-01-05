"use client";

import { Button } from "@/components/ui/button";
import {
  PillTabs,
  PillTabsContent,
  PillTabsList,
  PillTabsTrigger,
} from "@/components/ui/pill-tabs";
import type {
  Attachment,
  EquipmentCategory,
  EquipmentMeter,
  EquipmentType,
} from "@/db/schema";
import {
  Building2,
  FileText,
  Gauge,
  Loader2,
  Settings2,
  Wallet,
  Wrench,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DocumentsTab,
  FinancialsTab,
  GeneralTab,
  MetersTab,
  OrganizationTab,
  SpecificationsTab,
} from "./tabs";

interface EquipmentFormProps {
  equipment?: {
    id: string;
    name: string;
    code: string;
    status: string;
    locationId: string;
    ownerId: string | null;
    departmentId: string | null;
    modelId: string | null;
    typeId: string | null;
    type?: {
      categoryId: string;
    } | null;
    parentId: string | null;
    // Phase 1.1 - Specifications
    serialNumber: string | null;
    manufacturer: string | null;
    modelYear: number | null;
    warrantyExpiration: Date | null;
    // Phase 1.2 - Financials
    purchaseDate: Date | null;
    purchasePrice: string | null;
    residualValue: string | null;
    usefulLifeYears: number | null;
  };
  locations: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  users: { id: string; name: string }[];
  models: { id: string; name: string }[];
  categories: EquipmentCategory[];
  types: EquipmentType[];
  equipmentList?: { id: string; name: string; code: string }[];
  attachments?: (Attachment & {
    uploadedBy?: { name: string } | null;
    url?: string;
  })[];
  meters?: EquipmentMeter[];
  isNew?: boolean;
  userPermissions?: string[];
}

const VALID_TABS = [
  "general",
  "organization",
  "specifications",
  "financials",
  "documents",
  "meters",
] as const;

type TabValue = (typeof VALID_TABS)[number];

export function EquipmentForm({
  equipment,
  locations,
  departments,
  users,
  models,
  categories,
  types,
  equipmentList = [],
  attachments = [],
  meters = [],
  isNew,
  userPermissions = [],
}: EquipmentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("general");

  // General tab state
  const [name, setName] = useState(equipment?.name || "");
  const [code, setCode] = useState(equipment?.code || "");
  const [status, setStatus] = useState(equipment?.status || "operational");
  const [categoryId, setCategoryId] = useState(
    equipment?.type?.categoryId || ""
  );
  const [typeId, setTypeId] = useState(equipment?.typeId || "");
  const [modelId, setModelId] = useState(equipment?.modelId || "");

  // Organization tab state
  const [locationId, setLocationId] = useState(
    equipment?.locationId || searchParams.get("locationId") || ""
  );
  const [ownerId, setOwnerId] = useState(equipment?.ownerId || "");
  const [departmentId, setDepartmentId] = useState(
    equipment?.departmentId || ""
  );
  const [parentId, setParentId] = useState(
    equipment?.parentId || searchParams.get("parentId") || ""
  );
  const [parentSearch, setParentSearch] = useState("");

  // Specifications tab state
  const [serialNumber, setSerialNumber] = useState(
    equipment?.serialNumber || ""
  );
  const [manufacturer, setManufacturer] = useState(
    equipment?.manufacturer || ""
  );
  const [modelYear, setModelYear] = useState(
    equipment?.modelYear?.toString() || ""
  );
  const [warrantyExpiration, setWarrantyExpiration] = useState(
    equipment?.warrantyExpiration
      ? new Date(equipment.warrantyExpiration).toISOString().split("T")[0]
      : ""
  );

  // Financials tab state
  const [purchaseDate, setPurchaseDate] = useState(
    equipment?.purchaseDate
      ? new Date(equipment.purchaseDate).toISOString().split("T")[0]
      : ""
  );
  const [purchasePrice, setPurchasePrice] = useState(
    equipment?.purchasePrice || ""
  );
  const [residualValue, setResidualValue] = useState(
    equipment?.residualValue || ""
  );
  const [usefulLifeYears, setUsefulLifeYears] = useState(
    equipment?.usefulLifeYears?.toString() || ""
  );

  // Handle hash-based tab navigation
  useEffect(() => {
    const hash = window.location.hash.slice(1) as TabValue;
    if (VALID_TABS.includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (value: string) => {
    const tab = value as TabValue;
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        // General
        name,
        code,
        status,
        modelId: modelId || null,
        typeId: typeId || null,
        // Organization
        locationId,
        ownerId: ownerId || null,
        departmentId: departmentId || null,
        parentId: parentId || null,
        // Specifications
        serialNumber: serialNumber || null,
        manufacturer: manufacturer || null,
        modelYear: modelYear ? Number.parseInt(modelYear) : null,
        warrantyExpiration: warrantyExpiration || null,
        // Financials
        purchaseDate: purchaseDate || null,
        purchasePrice: purchasePrice || null,
        residualValue: residualValue || null,
        usefulLifeYears: usefulLifeYears ? Number.parseInt(usefulLifeYears) : null,
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

  // Meter CRUD handlers (these would call server actions in a real implementation)
  const handleCreateMeter = async (data: {
    name: string;
    type: string;
    unit: string;
    currentReading?: string;
  }) => {
    if (!equipment?.id) return { success: false, error: "Equipment not saved" };

    try {
      const res = await fetch(`/api/equipment/${equipment.id}/meters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        return { success: false, error: json.error || "Failed to create meter" };
      }

      router.refresh();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create meter",
      };
    }
  };

  const handleUpdateMeter = async (
    meterId: string,
    data: { name: string; type: string; unit: string; currentReading?: string }
  ) => {
    try {
      const res = await fetch(`/api/equipment/meters/${meterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        return { success: false, error: json.error || "Failed to update meter" };
      }

      router.refresh();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update meter",
      };
    }
  };

  const handleDeleteMeter = async (meterId: string) => {
    try {
      const res = await fetch(`/api/equipment/meters/${meterId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        return { success: false, error: json.error || "Failed to delete meter" };
      }

      router.refresh();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to delete meter",
      };
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-700">
          {error}
        </div>
      )}

      <PillTabs value={activeTab} onValueChange={handleTabChange}>
        <PillTabsList className="overflow-x-auto">
          <PillTabsTrigger value="general">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </PillTabsTrigger>
          <PillTabsTrigger value="organization">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organization</span>
          </PillTabsTrigger>
          <PillTabsTrigger value="specifications">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Specs</span>
          </PillTabsTrigger>
          <PillTabsTrigger value="financials">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Financials</span>
          </PillTabsTrigger>
          <PillTabsTrigger value="documents">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </PillTabsTrigger>
          <PillTabsTrigger value="meters">
            <Gauge className="h-4 w-4" />
            <span className="hidden sm:inline">Meters</span>
          </PillTabsTrigger>
        </PillTabsList>

        <PillTabsContent value="general">
          <GeneralTab
            name={name}
            setName={setName}
            code={code}
            setCode={setCode}
            status={status}
            setStatus={setStatus}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            typeId={typeId}
            setTypeId={setTypeId}
            modelId={modelId}
            setModelId={setModelId}
            categories={categories}
            types={types}
            models={models}
            isNew={isNew}
          />
        </PillTabsContent>

        <PillTabsContent value="organization">
          <OrganizationTab
            locationId={locationId}
            setLocationId={setLocationId}
            departmentId={departmentId}
            setDepartmentId={setDepartmentId}
            ownerId={ownerId}
            setOwnerId={setOwnerId}
            parentId={parentId}
            setParentId={setParentId}
            parentSearch={parentSearch}
            setParentSearch={setParentSearch}
            locations={locations}
            departments={departments}
            users={users}
            equipmentList={equipmentList}
            equipmentId={equipment?.id}
          />
        </PillTabsContent>

        <PillTabsContent value="specifications">
          <SpecificationsTab
            serialNumber={serialNumber}
            setSerialNumber={setSerialNumber}
            manufacturer={manufacturer}
            setManufacturer={setManufacturer}
            modelYear={modelYear}
            setModelYear={setModelYear}
            warrantyExpiration={warrantyExpiration}
            setWarrantyExpiration={setWarrantyExpiration}
          />
        </PillTabsContent>

        <PillTabsContent value="financials">
          <FinancialsTab
            purchaseDate={purchaseDate}
            setPurchaseDate={setPurchaseDate}
            purchasePrice={purchasePrice}
            setPurchasePrice={setPurchasePrice}
            residualValue={residualValue}
            setResidualValue={setResidualValue}
            usefulLifeYears={usefulLifeYears}
            setUsefulLifeYears={setUsefulLifeYears}
            isNew={isNew}
          />
        </PillTabsContent>

        <PillTabsContent value="documents">
          <DocumentsTab
            equipmentId={equipment?.id}
            attachments={attachments}
            isNew={isNew}
            userPermissions={userPermissions}
          />
        </PillTabsContent>

        <PillTabsContent value="meters">
          <MetersTab
            equipmentId={equipment?.id}
            meters={meters}
            isNew={isNew}
            onCreateMeter={handleCreateMeter}
            onUpdateMeter={handleUpdateMeter}
            onDeleteMeter={handleDeleteMeter}
          />
        </PillTabsContent>
      </PillTabs>

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
