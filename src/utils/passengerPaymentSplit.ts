const EPSILON = 0.0001;

export function splitAmountEqually(total: number, count: number): number[] {
  if (count <= 0) return [];
  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  const shares: number[] = [];
  for (let i = 0; i < count; i++) {
    shares.push((base + (i < remainder ? 1 : 0)) / 100);
  }
  return shares;
}

export function amountsMatchTotal(total: number, amounts: number[]): boolean {
  const sum = amounts.reduce((acc, n) => acc + n, 0);
  return Math.abs(sum - total) <= EPSILON;
}

export const passengerTypeLabel: Record<string, string> = {
  adult: "Adulto",
  junior: "Juvenil",
  child: "Niño",
};

export const passengerPaymentStatusLabel: Record<string, string> = {
  none: "Sin pagos",
  partial: "Parcialmente pagado",
  paid: "Liquidado",
};