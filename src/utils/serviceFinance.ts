import { parseOptionalMoneyInput } from "./packageInfoPricing";
import { calcServiceProfit } from "./serviceProfit";

export function calcGanancia(
  clientCost: string,
  platformCost: string,
): number | null {
  return calcServiceProfit(clientCost, platformCost);
}

export function calcGananciaLibre(
  clientCost: string,
  platformCost: string,
  bonusDiscount: string,
): number | null {
  const base = calcGanancia(clientCost, platformCost);
  if (base === null) return null;
  const bonus = parseOptionalMoneyInput(bonusDiscount) ?? 0;
  return Math.round((base - bonus) * 10000) / 10000;
}
