import type { Reservation } from "../types/reservation";
import { resolveReservationReturnDate } from "./packageDates";

/** Días tras el regreso antes de mover la reserva a Historial. */
export const HISTORY_GRACE_DAYS = 6;

export type ReservationTripTab = "upcoming" | "history";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Días transcurridos desde la fecha de regreso (negativo = viaje futuro). */
export function daysSinceReturnDate(
  returnDateIso: string,
  referenceDate: Date = new Date(),
): number {
  const returnDay = startOfDay(new Date(`${returnDateIso}T00:00:00`));
  const today = startOfDay(referenceDate);
  const diffMs = today.getTime() - returnDay.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Historial: regreso hace más de 6 días.
 * Próximos: futuro, en curso o regreso hace 6 días o menos.
 */
export function isReservationInHistory(
  reservation: Reservation,
  referenceDate: Date = new Date(),
): boolean {
  const returnDate = resolveReservationReturnDate(reservation);
  if (!returnDate) return false;
  return daysSinceReturnDate(returnDate, referenceDate) > HISTORY_GRACE_DAYS;
}

export function splitReservationsByTripDate(
  reservations: Reservation[],
  referenceDate: Date = new Date(),
) {
  const upcoming: Reservation[] = [];
  const history: Reservation[] = [];

  for (const reservation of reservations) {
    if (isReservationInHistory(reservation, referenceDate)) {
      history.push(reservation);
    } else {
      upcoming.push(reservation);
    }
  }

  return { upcoming, history };
}

export function filterReservationsByTab(
  reservations: Reservation[],
  tab: ReservationTripTab,
  referenceDate: Date = new Date(),
): Reservation[] {
  const { upcoming, history } = splitReservationsByTripDate(
    reservations,
    referenceDate,
  );
  return tab === "history" ? history : upcoming;
}
