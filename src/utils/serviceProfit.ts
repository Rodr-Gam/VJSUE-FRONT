export function calcServiceProfit(
  clientCost?: string | number | null,
  providerCost?: string | number | null,
): number | null {
  if (clientCost === null || clientCost === undefined || clientCost === "") {
    return null;
  }

  if (providerCost === null || providerCost === undefined || providerCost === "") {
    return null;
  }

  const client = Number(clientCost);
  const provider = Number(providerCost);

  if (Number.isNaN(client) || Number.isNaN(provider)) {
    return null;
  }

  return Math.round((client - provider) * 10000) / 10000;
}

export function normalizeClientCost(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const amount = parseFloat(trimmed);
  if (Number.isNaN(amount) || amount < 0) return null;

  return amount;
}

export function profitFromRecord(
  profit: number | string | null | undefined,
  clientCost?: string | number | null,
  providerCost?: string | number | null,
): number | null {
  if (profit !== null && profit !== undefined && profit !== "") {
    const parsed = Number(profit);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return calcServiceProfit(clientCost, providerCost);
}

export function profitNetFromRecord(
  profit: number,
  profitNet?: number | string | null,
  bonusDiscount?: string | number | null,
): number {
  if (profitNet !== null && profitNet !== undefined && profitNet !== "") {
    const parsed = Number(profitNet);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const bonus = Number(bonusDiscount ?? 0);
  const safeBonus = Number.isFinite(bonus) ? bonus : 0;
  return Math.round((profit - safeBonus) * 10000) / 10000;
}
