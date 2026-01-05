"use client";

import { FieldGroup, FormGrid } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";

interface SpecificationsTabProps {
  serialNumber: string;
  setSerialNumber: (value: string) => void;
  manufacturer: string;
  setManufacturer: (value: string) => void;
  modelYear: string;
  setModelYear: (value: string) => void;
  warrantyExpiration: string;
  setWarrantyExpiration: (value: string) => void;
}

export function SpecificationsTab({
  serialNumber,
  setSerialNumber,
  manufacturer,
  setManufacturer,
  modelYear,
  setModelYear,
  warrantyExpiration,
  setWarrantyExpiration,
}: SpecificationsTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          Track detailed specifications for your equipment. These fields help with
          warranty tracking, manufacturer support, and asset lifecycle management.
        </p>
      </div>

      <FormGrid>
        {/* Serial Number */}
        <FieldGroup
          label="Serial Number"
          description="Manufacturer's unique identifier"
        >
          <Input
            id="serialNumber"
            type="text"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="e.g., SN-12345-ABC"
          />
        </FieldGroup>

        {/* Manufacturer */}
        <FieldGroup label="Manufacturer">
          <Input
            id="manufacturer"
            type="text"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            placeholder="e.g., Siemens, ABB, Fanuc"
          />
        </FieldGroup>

        {/* Model Year */}
        <FieldGroup
          label="Model Year"
          description="Year of manufacture"
        >
          <Input
            id="modelYear"
            type="number"
            min="1900"
            max="2100"
            value={modelYear}
            onChange={(e) => setModelYear(e.target.value)}
            placeholder={`e.g., ${new Date().getFullYear()}`}
          />
        </FieldGroup>

        {/* Warranty Expiration */}
        <FieldGroup
          label="Warranty Expiration"
          description="When the manufacturer warranty ends"
        >
          <Input
            id="warrantyExpiration"
            type="date"
            value={warrantyExpiration}
            onChange={(e) => setWarrantyExpiration(e.target.value)}
          />
        </FieldGroup>
      </FormGrid>
    </div>
  );
}
