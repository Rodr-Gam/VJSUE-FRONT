import type { ReservationState } from "../types/reservation";

/** Reserva pagada — el cliente puede ver claves de confirmación. */
export function isReservationPaid(state: string | undefined): boolean {
  const key = (state ?? "").toLowerCase().trim();
  return key === "paid" || key === "pagado" || key === "pagada";
}

/** Muestra HGDL/clave solo si la reserva está pagada y hay valor. */
export function shouldShowHgdlKey(
  state: string | undefined,
  key?: string | null,
): boolean {
  return isReservationPaid(state) && Boolean(key?.trim());
}

export function getReservationStateLabel(state: string): string {
  const labels: Record<string, string> = {
    confirmed: "Confirmada",
    confirmada: "Confirmada",
    pending: "Pendiente",
    pendiente: "Pendiente",
    canceled: "Cancelada",
    cancelled: "Cancelada",
    cancelada: "Cancelada",
    finished: "Finalizada",
    finalizada: "Finalizada",
    paid: "Pagada",
    pagado: "Pagada",
    pagada: "Pagada",
  };
  return labels[state?.toLowerCase()] ?? state ?? "—";
}

export type { ReservationState };
