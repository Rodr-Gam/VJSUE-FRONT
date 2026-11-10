export function formatAdminDate(fecha?: string | null): string {
  if (!fecha) return "—";
  const part = fecha.split("T")[0];
  const [year, month, day] = part.split("-");
  if (!year || !month || !day) return part;
  return `${day}/${month}/${year}`;
}

export function formatAdminMoney(value: number | string | undefined): string {
  return Number(value || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
