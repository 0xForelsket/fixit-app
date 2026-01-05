"use client";

import { FieldGroup, FormGrid } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import {
  calculateDepreciation,
  formatCurrency,
  getDepreciationInfo,
} from "@/lib/utils/depreciation";
import { Calendar, Clock, DollarSign, TrendingDown } from "lucide-react";
import { useMemo } from "react";

interface FinancialsTabProps {
  purchaseDate: string;
  setPurchaseDate: (value: string) => void;
  purchasePrice: string;
  setPurchasePrice: (value: string) => void;
  residualValue: string;
  setResidualValue: (value: string) => void;
  usefulLifeYears: string;
  setUsefulLifeYears: (value: string) => void;
  isNew?: boolean;
}

export function FinancialsTab({
  purchaseDate,
  setPurchaseDate,
  purchasePrice,
  setPurchasePrice,
  residualValue,
  setResidualValue,
  usefulLifeYears,
  setUsefulLifeYears,
  isNew,
}: FinancialsTabProps) {
  // Calculate depreciation if we have enough data
  const depreciation = useMemo(() => {
    const info = getDepreciationInfo({
      purchasePrice,
      residualValue,
      usefulLifeYears: usefulLifeYears
        ? Number.parseInt(usefulLifeYears)
        : null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
    });

    if (!info) return null;
    return calculateDepreciation(info);
  }, [purchaseDate, purchasePrice, residualValue, usefulLifeYears]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          Track financial data for depreciation calculations and total cost of
          ownership. Book value is calculated using straight-line depreciation.
        </p>
      </div>

      <FormGrid>
        {/* Purchase Date */}
        <FieldGroup
          label="Purchase Date"
          description="When the asset was acquired"
        >
          <Input
            id="purchaseDate"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </FieldGroup>

        {/* Purchase Price */}
        <FieldGroup
          label="Purchase Price"
          description="Original acquisition cost"
        >
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="purchasePrice"
              type="number"
              min="0"
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="0.00"
              className="pl-10"
            />
          </div>
        </FieldGroup>

        {/* Residual Value */}
        <FieldGroup
          label="Residual Value"
          description="Expected value at end of useful life"
        >
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="residualValue"
              type="number"
              min="0"
              step="0.01"
              value={residualValue}
              onChange={(e) => setResidualValue(e.target.value)}
              placeholder="0.00"
              className="pl-10"
            />
          </div>
        </FieldGroup>

        {/* Useful Life */}
        <FieldGroup
          label="Useful Life (Years)"
          description="Expected operational lifespan"
        >
          <Input
            id="usefulLifeYears"
            type="number"
            min="1"
            max="100"
            value={usefulLifeYears}
            onChange={(e) => setUsefulLifeYears(e.target.value)}
            placeholder="e.g., 10"
          />
        </FieldGroup>
      </FormGrid>

      {/* Depreciation Summary - only show if we have data and not a new equipment */}
      {depreciation && !isNew && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Depreciation Summary
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Current Book Value */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase">
                  Book Value
                </span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(depreciation.bookValue)}
              </p>
            </div>

            {/* Accumulated Depreciation */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingDown className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase">
                  Accumulated
                </span>
              </div>
              <p className="text-2xl font-bold text-danger-600">
                {formatCurrency(depreciation.accumulatedDepreciation)}
              </p>
            </div>

            {/* Annual Depreciation */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase">Annual</span>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(depreciation.annualDepreciation)}
              </p>
              <p className="text-xs text-muted-foreground">per year</p>
            </div>

            {/* Time Remaining */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase">
                  Remaining
                </span>
              </div>
              <p className="text-2xl font-bold">
                {depreciation.isFullyDepreciated
                  ? "Fully Depreciated"
                  : `${Math.floor(depreciation.monthsRemaining / 12)}y ${depreciation.monthsRemaining % 12}m`}
              </p>
              <p className="text-xs text-muted-foreground">
                {depreciation.percentDepreciated.toFixed(1)}% depreciated
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
