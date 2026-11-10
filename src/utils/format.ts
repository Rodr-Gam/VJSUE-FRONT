export const formatPrice = (value?: string | number | null): string => {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return `$${num.toFixed(2)}`;
};

export const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// Traduce el enum occupancy_type de room_prices a español
export const OCCUPANCY_LABELS: Record<string, string> = {
  single: "Individual",
  double: "Doble",
  triple: "Triple",
  quadruple: "Cuádruple",
  suite: "Suite",
};
