import type { ImportantDateSyncStatus, ReminderPreset } from "../types/importantDate";

export const IMPORTANT_DATE_TYPE_OPTIONS = [
  { value: "informativo", label: "Informativo" },
  { value: "birthday", label: "Cumpleaños" },
  { value: "anniversary", label: "Aniversario" },
  { value: "special", label: "Fecha especial" },
  { value: "due_date", label: "Vencimiento" },
  { value: "other", label: "Otro" },
] as const;

/** Etiquetas para registros antiguos con claves en inglés */
const LEGACY_TYPE_LABELS: Record<string, string> = {
  informativo: "Informativo",
  birthday: "Cumpleaños",
  anniversary: "Aniversario",
  special: "Fecha especial",
  due_date: "Vencimiento",
  other: "Otro",
};

export function displayImportantDateType(type: string): string {
  const trimmed = type?.trim();
  if (!trimmed) return "—";
  return LEGACY_TYPE_LABELS[trimmed] ?? trimmed;
}

export const reminderPresetLabel: Record<ReminderPreset, string> = {
  same_day: "El mismo día",
  one_day: "Un día antes",
  three_days: "Tres días antes",
  one_week: "Una semana antes",
  custom: "Personalizado",
};

export const syncStatusLabel: Record<ImportantDateSyncStatus, string> = {
  synced: "Sincronizado",
  pending: "Pendiente",
  error: "Error",
};

export type ImportantDateSyncFilter = ImportantDateSyncStatus | "needs_sync" | "";

export const syncFilterOptions: { value: ImportantDateSyncFilter; label: string }[] = [
  { value: "", label: "Sync: todos" },
  { value: "needs_sync", label: "Falta sincronizar" },
  { value: "synced", label: "Sincronizado" },
  { value: "pending", label: "Pendiente" },
  { value: "error", label: "Error" },
];

export type ImportantDateClientFilter = "" | "with" | "without" | "frequent";

export const clientFilterOptions: { value: ImportantDateClientFilter; label: string }[] = [
  { value: "", label: "Todos los clientes" },
  { value: "frequent", label: "Clientes destacados" },
  { value: "with", label: "Con cliente asignado" },
  { value: "without", label: "Recordatorio de clientes" },
];

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const monthFilterOptions = [
  { value: "", label: "Cualquier mes" },
  ...MONTH_NAMES.map((label, i) => ({ value: String(i + 1), label })),
];

export const withinDaysOptions = [
  { value: "", label: "Cualquier fecha" },
  { value: "7", label: "Próximos 7 días" },
  { value: "30", label: "Próximos 30 días" },
  { value: "90", label: "Próximos 90 días" },
];

export function clientDisplayName(
  user: {
    name: string;
    last_name?: string | null;
  } | null,
  options?: { type?: string },
): string {
  if (!user) {
    if (options?.type === "informativo") return "Informativo";
    return "Recordatorio de clientes";
  }
  return [user.name, user.last_name].filter(Boolean).join(" ");
}

export function summarizeText(text: string | null, max = 80): string {
  if (!text?.trim()) return "—";
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}
