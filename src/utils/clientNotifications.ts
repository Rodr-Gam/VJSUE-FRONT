import type { Reservation } from "../types/reservation";
import { toDateInputValue, resolveReservationReturnDate } from "./packageDates";
import {
  canManagePassengers,
  passengerProgress,
} from "./passengerProgress";
import {
  daysSinceReturnDate,
  isReservationInHistory,
} from "./reservationTripFilter";

export type ClientNotificationKind =
  | "passengers_incomplete"
  | "trip_countdown"
  | "trip_today"
  | "trip_in_progress";

export interface ClientNotification {
  id: string;
  text: string;
  time: string;
  href: string;
  kind: ClientNotificationKind;
  priority: number;
}

const READ_STORAGE_KEY = "viajes-suena-client-notif-read";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysUntilDate(
  isoDate: string,
  referenceDate: Date = new Date(),
): number {
  const target = startOfDay(new Date(`${isoDate}T00:00:00`));
  const today = startOfDay(referenceDate);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isCanceled(state: string | undefined): boolean {
  const key = (state ?? "").toLowerCase();
  return ["canceled", "cancelled", "cancelada"].includes(key);
}

function getDestinationLabel(reservation: Reservation): string {
  return (
    reservation.package?.city?.name ??
    reservation.package?.name ??
    "tu destino"
  );
}

function isTripInProgress(
  reservation: Reservation,
  referenceDate: Date = new Date(),
): boolean {
  const departure = toDateInputValue(reservation.departure_date);
  if (!departure) return false;

  const daysUntilDep = daysUntilDate(departure, referenceDate);
  if (daysUntilDep > 0) return false;

  const returnDate = resolveReservationReturnDate(reservation);
  if (!returnDate) return true;

  return daysSinceReturnDate(returnDate, referenceDate) <= 0;
}

function tripCountdownMessage(
  destination: string,
  daysUntilDep: number,
): { text: string; time: string; priority: number } | null {
  if (daysUntilDep === 0) {
    return {
      text: `¡Hoy es tu salida hacia ${destination}! Buen viaje ✈️`,
      time: "Hoy",
      priority: 100,
    };
  }
  if (daysUntilDep === 1) {
    return {
      text: `¡Mañana viajas a ${destination}! Revisa tus detalles de reserva.`,
      time: "Mañana",
      priority: 90,
    };
  }
  if (daysUntilDep === 2) {
    return {
      text: `Tu viaje a ${destination} es en 2 días. ¡Ya casi es hora!`,
      time: "En 2 días",
      priority: 80,
    };
  }
  if (daysUntilDep === 3) {
    return {
      text: `Faltan 3 días para tu viaje a ${destination}.`,
      time: "En 3 días",
      priority: 70,
    };
  }
  if (daysUntilDep >= 4 && daysUntilDep <= 7) {
    return {
      text: `Tu viaje a ${destination} está cerca — faltan ${daysUntilDep} días.`,
      time: `En ${daysUntilDep} días`,
      priority: 60,
    };
  }
  return null;
}

export function buildClientNotifications(
  reservations: Reservation[],
  referenceDate: Date = new Date(),
): ClientNotification[] {
  const items: ClientNotification[] = [];

  for (const reservation of reservations) {
    if (isCanceled(reservation.state)) continue;
    if (isReservationInHistory(reservation, referenceDate)) continue;

    const destination = getDestinationLabel(reservation);
    const detailHref = `/cliente/detalle/${reservation.id}`;
    const passengersHref = `/cliente/reservas/${reservation.id}/pasajeros`;

    if (canManagePassengers(reservation.state)) {
      const progress = passengerProgress(reservation);
      if (progress.totalRequired > 0 && !progress.isComplete) {
        const missing = progress.totalRequired - progress.totalRegistered;
        items.push({
          id: `passengers-${reservation.id}`,
          text: `Completa los datos de pasajeros para ${destination} (${progress.totalRegistered}/${progress.totalRequired} registrados).`,
          time:
            missing === 1
              ? "Falta 1 pasajero"
              : `Faltan ${missing} pasajeros`,
          href: passengersHref,
          kind: "passengers_incomplete",
          priority: 85,
        });
      }
    }

    const departure = toDateInputValue(reservation.departure_date);
    if (!departure) continue;

    if (isTripInProgress(reservation, referenceDate)) {
      items.push({
        id: `in-progress-${reservation.id}`,
        text: `Tu viaje a ${destination} está en curso. ¡Disfrútalo!`,
        time: "Viaje activo",
        href: detailHref,
        kind: "trip_in_progress",
        priority: 75,
      });
      continue;
    }

    const daysUntilDep = daysUntilDate(departure, referenceDate);
    const countdown = tripCountdownMessage(destination, daysUntilDep);
    if (countdown) {
      items.push({
        id: `trip-${reservation.id}-${daysUntilDep}`,
        text: countdown.text,
        time: countdown.time,
        href: detailHref,
        kind: daysUntilDep === 0 ? "trip_today" : "trip_countdown",
        priority: countdown.priority,
      });
    }
  }

  return items.sort((a, b) => b.priority - a.priority);
}

export function loadReadNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function saveReadNotificationIds(ids: Set<string>): void {
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]));
}

export function applyReadState(
  notifications: ClientNotification[],
  readIds: Set<string>,
): Array<ClientNotification & { read: boolean }> {
  return notifications.map((n) => ({
    ...n,
    read: readIds.has(n.id),
  }));
}

/** Elimina IDs leídos que ya no existen en las notificaciones actuales. */
export function pruneReadIds(
  readIds: Set<string>,
  activeIds: string[],
): Set<string> {
  const active = new Set(activeIds);
  return new Set([...readIds].filter((id) => active.has(id)));
}
