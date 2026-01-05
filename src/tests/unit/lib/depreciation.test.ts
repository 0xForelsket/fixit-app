import {
  calculateDepreciation,
  formatCurrency,
  getDepreciationInfo,
  hasCompleteFinancialData,
} from "@/lib/utils/depreciation";
import { describe, expect, it } from "bun:test";

describe("calculateDepreciation", () => {
  const baseInfo = {
    purchasePrice: 10000,
    residualValue: 1000,
    usefulLifeYears: 5,
    purchaseDate: new Date("2020-01-01"),
  };

  it("returns correct values for a new asset (0 months elapsed)", () => {
    const result = calculateDepreciation(baseInfo, new Date("2020-01-01"));

    expect(result.bookValue).toBe(10000);
    expect(result.accumulatedDepreciation).toBe(0);
    expect(result.annualDepreciation).toBe(1800); // (10000-1000)/5
    expect(result.monthlyDepreciation).toBe(150); // 1800/12
    expect(result.percentDepreciated).toBe(0);
    expect(result.isFullyDepreciated).toBe(false);
    expect(result.monthsRemaining).toBe(60);
  });

  it("returns correct values mid-life (30 months elapsed)", () => {
    const result = calculateDepreciation(baseInfo, new Date("2022-07-01"));

    // 30 months * $150/month = $4500 accumulated
    expect(result.accumulatedDepreciation).toBe(4500);
    expect(result.bookValue).toBe(5500); // 10000 - 4500
    expect(result.percentDepreciated).toBe(50);
    expect(result.isFullyDepreciated).toBe(false);
    expect(result.monthsRemaining).toBe(30);
  });

  it("caps depreciation at residual value when fully depreciated", () => {
    const result = calculateDepreciation(baseInfo, new Date("2026-01-01"));

    expect(result.bookValue).toBe(1000); // residual value
    expect(result.accumulatedDepreciation).toBe(9000); // full depreciable amount
    expect(result.percentDepreciated).toBe(100);
    expect(result.isFullyDepreciated).toBe(true);
    expect(result.monthsRemaining).toBe(0);
  });

  it("handles asset past useful life (over-depreciated)", () => {
    const result = calculateDepreciation(baseInfo, new Date("2030-01-01"));

    expect(result.bookValue).toBe(1000); // never below residual
    expect(result.accumulatedDepreciation).toBe(9000); // capped
    expect(result.isFullyDepreciated).toBe(true);
  });

  it("handles negative months (future purchase date)", () => {
    const result = calculateDepreciation(baseInfo, new Date("2019-06-01"));

    expect(result.bookValue).toBe(10000);
    expect(result.accumulatedDepreciation).toBe(0);
    expect(result.monthsRemaining).toBe(60);
  });

  it("uses current date by default", () => {
    const recentPurchase = {
      ...baseInfo,
      purchaseDate: new Date(), // purchased today
    };
    const result = calculateDepreciation(recentPurchase);

    expect(result.bookValue).toBe(10000);
    expect(result.accumulatedDepreciation).toBe(0);
  });
});

describe("formatCurrency", () => {
  it("formats positive values correctly", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats zero correctly", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats large values with commas", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000.00");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatCurrency(123.456)).toBe("$123.46");
  });

  it("accepts custom currency", () => {
    expect(formatCurrency(100, "EUR")).toBe("€100.00");
  });
});

describe("hasCompleteFinancialData", () => {
  it("returns true when all required fields are present", () => {
    const equipment = {
      purchasePrice: "10000",
      residualValue: "1000",
      usefulLifeYears: 5,
      purchaseDate: new Date("2020-01-01"),
    };
    expect(hasCompleteFinancialData(equipment)).toBe(true);
  });

  it("returns false when purchasePrice is missing", () => {
    const equipment = {
      purchasePrice: null,
      residualValue: "1000",
      usefulLifeYears: 5,
      purchaseDate: new Date("2020-01-01"),
    };
    expect(hasCompleteFinancialData(equipment)).toBe(false);
  });

  it("returns false when usefulLifeYears is 0", () => {
    const equipment = {
      purchasePrice: "10000",
      residualValue: "1000",
      usefulLifeYears: 0,
      purchaseDate: new Date("2020-01-01"),
    };
    expect(hasCompleteFinancialData(equipment)).toBe(false);
  });

  it("returns false when purchasePrice is 0", () => {
    const equipment = {
      purchasePrice: "0",
      residualValue: "1000",
      usefulLifeYears: 5,
      purchaseDate: new Date("2020-01-01"),
    };
    expect(hasCompleteFinancialData(equipment)).toBe(false);
  });

  it("returns false when purchaseDate is null", () => {
    const equipment = {
      purchasePrice: "10000",
      residualValue: "1000",
      usefulLifeYears: 5,
      purchaseDate: null,
    };
    expect(hasCompleteFinancialData(equipment)).toBe(false);
  });
});

describe("getDepreciationInfo", () => {
  it("returns DepreciationInfo when data is complete", () => {
    const equipment = {
      purchasePrice: "10000",
      residualValue: "1000",
      usefulLifeYears: 5,
      purchaseDate: new Date("2020-01-01"),
    };
    const result = getDepreciationInfo(equipment);

    expect(result).not.toBeNull();
    expect(result?.purchasePrice).toBe(10000);
    expect(result?.residualValue).toBe(1000);
    expect(result?.usefulLifeYears).toBe(5);
    expect(result?.purchaseDate).toEqual(new Date("2020-01-01"));
  });

  it("returns null when data is incomplete", () => {
    const equipment = {
      purchasePrice: null,
      residualValue: "1000",
      usefulLifeYears: 5,
      purchaseDate: new Date("2020-01-01"),
    };
    expect(getDepreciationInfo(equipment)).toBeNull();
  });

  it("handles missing residualValue by defaulting to 0", () => {
    const equipment = {
      purchasePrice: "10000",
      residualValue: null,
      usefulLifeYears: 5,
      purchaseDate: new Date("2020-01-01"),
    };
    // Should return null since residualValue is null (required)
    expect(getDepreciationInfo(equipment)).toBeNull();
  });
});
