/**
 * Equipment depreciation calculation utilities
 * Uses straight-line depreciation method
 */

/**
 * Calculate the difference in months between two dates
 */
function differenceInMonths(dateLeft: Date, dateRight: Date): number {
  const months =
    (dateLeft.getFullYear() - dateRight.getFullYear()) * 12 +
    (dateLeft.getMonth() - dateRight.getMonth());
  return months;
}

export interface DepreciationInfo {
  /** Original purchase price */
  purchasePrice: number;
  /** Expected value at end of useful life */
  residualValue: number;
  /** Total useful life in years */
  usefulLifeYears: number;
  /** When the asset was purchased */
  purchaseDate: Date;
}

export interface DepreciationResult {
  /** Current book value of the asset */
  bookValue: number;
  /** Total depreciation accumulated to date */
  accumulatedDepreciation: number;
  /** Annual depreciation amount */
  annualDepreciation: number;
  /** Monthly depreciation amount */
  monthlyDepreciation: number;
  /** Percentage of useful life consumed */
  percentDepreciated: number;
  /** Whether the asset is fully depreciated */
  isFullyDepreciated: boolean;
  /** Months remaining in useful life */
  monthsRemaining: number;
}

/**
 * Calculate straight-line depreciation for an asset
 *
 * Formula:
 * Annual Depreciation = (Purchase Price - Residual Value) / Useful Life
 * Accumulated Depreciation = Annual Depreciation × Years Elapsed
 * Book Value = Purchase Price - Accumulated Depreciation
 *
 * @param info - Asset depreciation parameters
 * @param asOfDate - Calculate depreciation as of this date (defaults to now)
 * @returns Depreciation calculation results
 */
export function calculateDepreciation(
  info: DepreciationInfo,
  asOfDate: Date = new Date()
): DepreciationResult {
  const { purchasePrice, residualValue, usefulLifeYears, purchaseDate } = info;

  // Calculate total depreciable amount
  const depreciableAmount = purchasePrice - residualValue;

  // Annual and monthly depreciation
  const annualDepreciation = depreciableAmount / usefulLifeYears;
  const monthlyDepreciation = annualDepreciation / 12;

  // Total useful life in months
  const totalUsefulLifeMonths = usefulLifeYears * 12;

  // Months elapsed since purchase
  const monthsElapsed = Math.max(0, differenceInMonths(asOfDate, purchaseDate));

  // Calculate accumulated depreciation (capped at depreciable amount)
  const accumulatedDepreciation = Math.min(
    monthsElapsed * monthlyDepreciation,
    depreciableAmount
  );

  // Calculate book value (never below residual value)
  const bookValue = Math.max(purchasePrice - accumulatedDepreciation, residualValue);

  // Calculate percentage depreciated
  const percentDepreciated = Math.min(
    (accumulatedDepreciation / depreciableAmount) * 100,
    100
  );

  // Check if fully depreciated
  const isFullyDepreciated = monthsElapsed >= totalUsefulLifeMonths;

  // Months remaining
  const monthsRemaining = Math.max(0, totalUsefulLifeMonths - monthsElapsed);

  return {
    bookValue: Math.round(bookValue * 100) / 100,
    accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
    annualDepreciation: Math.round(annualDepreciation * 100) / 100,
    monthlyDepreciation: Math.round(monthlyDepreciation * 100) / 100,
    percentDepreciated: Math.round(percentDepreciated * 10) / 10,
    isFullyDepreciated,
    monthsRemaining,
  };
}

/**
 * Format currency value for display
 */
export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Check if equipment has complete financial data for depreciation calculation
 */
export function hasCompleteFinancialData(equipment: {
  purchasePrice?: string | null;
  residualValue?: string | null;
  usefulLifeYears?: number | null;
  purchaseDate?: Date | null;
}): boolean {
  return (
    equipment.purchasePrice != null &&
    equipment.residualValue != null &&
    equipment.usefulLifeYears != null &&
    equipment.purchaseDate != null &&
    parseFloat(equipment.purchasePrice) > 0 &&
    equipment.usefulLifeYears > 0
  );
}

/**
 * Get depreciation info from equipment record
 */
export function getDepreciationInfo(equipment: {
  purchasePrice?: string | null;
  residualValue?: string | null;
  usefulLifeYears?: number | null;
  purchaseDate?: Date | null;
}): DepreciationInfo | null {
  if (!hasCompleteFinancialData(equipment)) {
    return null;
  }

  return {
    purchasePrice: parseFloat(equipment.purchasePrice!),
    residualValue: parseFloat(equipment.residualValue || "0"),
    usefulLifeYears: equipment.usefulLifeYears!,
    purchaseDate: new Date(equipment.purchaseDate!),
  };
}
