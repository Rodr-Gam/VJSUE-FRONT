export const PAYMENT_PLAN_MIN = 1;
export const PAYMENT_PLAN_MAX = 15;

/** Reparte un total en N partes con ajuste de centavos en las primeras parcialidades. */
export function equalInstallmentAmounts(total: number, parts: number): number[] {
  if (parts < 1 || !Number.isFinite(total) || total <= 0) {
    return [];
  }

  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / parts);
  const remainder = totalCents - base * parts;
  const result: number[] = [];

  for (let i = 0; i < parts; i++) {
    const cents = base + (i < remainder ? 1 : 0);
    result.push(cents / 100);
  }

  return result;
}

export function clampPaymentPlanInstallments(value: number): number {
  if (!Number.isFinite(value)) return PAYMENT_PLAN_MIN;
  return Math.min(PAYMENT_PLAN_MAX, Math.max(PAYMENT_PLAN_MIN, Math.trunc(value)));
}

export function installmentBalance(
  amount: number | string,
  settled: number | string = 0,
): number {
  const due = Math.max(0, Number(amount) || 0);
  const paid = Math.max(0, Number(settled) || 0);
  return Math.max(0, Math.round((due - paid) * 100) / 100);
}
