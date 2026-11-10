export const DEFAULT_PLATFORM_PROFIT_PERCENT = 17;
export const PLATFORM_PROFIT_PERCENT_OPTIONS = [17, 18] as const;
export type PlatformProfitPercent = (typeof PLATFORM_PROFIT_PERCENT_OPTIONS)[number];

/** @deprecated Usa DEFAULT_PLATFORM_PROFIT_PERCENT */
export const PLATFORM_PROFIT_RATE = DEFAULT_PLATFORM_PROFIT_PERCENT / 100;

export function normalizePlatformProfitPercent(value: unknown): PlatformProfitPercent {
  const n = typeof value === "string" ? parseInt(value, 10) : value;
  return n === 18 ? 18 : 17;
}

export function platformProfitRateFromPercent(
  percent: PlatformProfitPercent = DEFAULT_PLATFORM_PROFIT_PERCENT,
): number {
  return percent / 100;
}

export function parseOptionalMoneyInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100) / 100;
}

export function calcPlatformProfitFromCost(
  platformCost: string,
  profitPercent: PlatformProfitPercent = DEFAULT_PLATFORM_PROFIT_PERCENT,
): number | null {
  const base = parseOptionalMoneyInput(platformCost);
  if (base === null) return null;
  const rate = platformProfitRateFromPercent(profitPercent);
  return Math.round(base * rate * 100) / 100;
}

/** Pago a proveedor = costo real plataforma − ganancia (% seleccionado). */
export function calcSupplierPaymentFromPlatformCost(
  platformCost: string,
  profitPercent: PlatformProfitPercent = DEFAULT_PLATFORM_PROFIT_PERCENT,
): number | null {
  const base = parseOptionalMoneyInput(platformCost);
  const profit = calcPlatformProfitFromCost(platformCost, profitPercent);
  if (base === null || profit === null) return null;
  return Math.round((base - profit) * 100) / 100;
}

export function sumBreakdownPrices(
  adult: string,
  junior: string,
  child: string,
): number {
  const a = parseOptionalMoneyInput(adult) ?? 0;
  const j = parseOptionalMoneyInput(junior) ?? 0;
  const c = parseOptionalMoneyInput(child) ?? 0;
  return Math.round((a + j + c) * 100) / 100;
}

export interface PackagePricePassengerCounts {
  adults: number;
  juniors: number;
  children: number;
}

function totalPassengers(counts?: PackagePricePassengerCounts): number {
  if (!counts) return 0;
  return counts.adults + counts.juniors + counts.children;
}

/** Suma ponderada por cantidad de pasajeros cuando hay conteos; si no, suma de los tres precios. */
export function sumBreakdownPricesForValidation(
  adult: string,
  junior: string,
  child: string,
  passengerCounts?: PackagePricePassengerCounts,
): number {
  const pax = totalPassengers(passengerCounts);
  if (pax > 0 && passengerCounts) {
    const a = parseOptionalMoneyInput(adult) ?? 0;
    const j = parseOptionalMoneyInput(junior) ?? 0;
    const c = parseOptionalMoneyInput(child) ?? 0;
    const total =
      passengerCounts.adults * a +
      passengerCounts.juniors * j +
      passengerCounts.children * c;
    return Math.round(total * 100) / 100;
  }
  return sumBreakdownPrices(adult, junior, child);
}

export interface PackagePriceBreakdownInput {
  packageTotalCost: string;
  priceAdult: string;
  priceJunior: string;
  priceChild: string;
  passengerCounts?: PackagePricePassengerCounts;
}

export interface PackagePriceBreakdownStatus {
  sum: number;
  total: number | null;
  remaining: number | null;
  exceedsTotal: boolean;
  allPricesFilled: boolean;
}

export function getPackagePriceBreakdownStatus(
  input: PackagePriceBreakdownInput,
): PackagePriceBreakdownStatus {
  const total = parseOptionalMoneyInput(input.packageTotalCost);
  const sum = sumBreakdownPricesForValidation(
    input.priceAdult,
    input.priceJunior,
    input.priceChild,
    input.passengerCounts,
  );
  const allPricesFilled =
    input.priceAdult.trim() !== "" &&
    input.priceJunior.trim() !== "" &&
    input.priceChild.trim() !== "";

  let remaining: number | null = null;
  let exceedsTotal = false;
  if (total !== null) {
    const sumCents = Math.round(sum * 100);
    const totalCents = Math.round(total * 100);
    exceedsTotal = sumCents > totalCents;
    remaining = (totalCents - sumCents) / 100;
  }

  return {
    sum,
    total,
    remaining,
    exceedsTotal,
    allPricesFilled,
  };
}

/**
 * @param onSubmit Si es true y hay costo plataforma, exige los tres precios y suma exacta.
 */
export function validatePackagePriceBreakdown(
  input: PackagePriceBreakdownInput,
  onSubmit = false,
): string | null {
  const status = getPackagePriceBreakdownStatus(input);
  const totalFilled = input.packageTotalCost.trim() !== "";

  if (!totalFilled) {
    return null;
  }

  if (status.exceedsTotal && status.total !== null) {
    const over = (status.sum - status.total).toFixed(2);
    return `La suma es ($${status.sum.toFixed(2)}) supera el costo real plataforma. Exceso: $${over}.`;
  }

  if (!onSubmit) {
    return null;
  }

  if (!status.allPricesFilled) {
    return "Completa precio adulto, juvenil y niño.";
  }

  if (status.total === null) {
    return "El costo real plataforma no es válido.";
  }

  const sumCents = Math.round(status.sum * 100);
  const totalCents = Math.round(status.total * 100);

  if (sumCents > totalCents) {
    const over = ((sumCents - totalCents) / 100).toFixed(2);
    return `La suma por edad no puede superar el costo real plataforma. Exceso: $${over}.`;
  }

  if (sumCents !== totalCents) {
    const diff = (Math.abs(sumCents - totalCents) / 100).toFixed(2);
    return `Los precios por edad deben sumar exactamente el costo real plataforma. Diferencia: $${diff}.`;
  }

  return null;
}
