import type { Passenger, PassengerType } from "../types/passenger";
import type { Reservation } from "../types/reservation";

export const PASSENGER_TYPE_LABELS: Record<PassengerType, string> = {
  adult: "Adulto",
  junior: "Juvenil",
  child: "Infante",
};

export function passengerLimits(reservation: Reservation) {
  return {
    adult: reservation.adults ?? 0,
    junior: reservation.juniors ?? 0,
    child: reservation.children ?? 0,
  };
}

export function countPassengersByType(
  passengers: Passenger[],
  type: PassengerType,
): number {
  return passengers.filter((p) => p.type === type).length;
}

export function passengerProgress(reservation: Reservation) {
  const passengers = reservation.passengers ?? [];
  const limits = passengerLimits(reservation);

  const adult = {
    registered: countPassengersByType(passengers, "adult"),
    limit: limits.adult,
  };
  const junior = {
    registered: countPassengersByType(passengers, "junior"),
    limit: limits.junior,
  };
  const child = {
    registered: countPassengersByType(passengers, "child"),
    limit: limits.child,
  };

  const totalRegistered = passengers.length;
  const totalRequired = limits.adult + limits.junior + limits.child;

  return {
    adult,
    junior,
    child,
    totalRegistered,
    totalRequired,
    isComplete: totalRegistered >= totalRequired && totalRequired > 0,
    hasSlotsAvailable:
      adult.registered < adult.limit ||
      junior.registered < junior.limit ||
      child.registered < child.limit,
  };
}

export function getAvailablePassengerTypes(
  reservation: Reservation,
): PassengerType[] {
  const progress = passengerProgress(reservation);
  const types: PassengerType[] = [];

  if (progress.adult.registered < progress.adult.limit) types.push("adult");
  if (progress.junior.registered < progress.junior.limit) types.push("junior");
  if (progress.child.registered < progress.child.limit) types.push("child");

  return types;
}

export function getDefaultPassengerType(
  reservation: Reservation,
): PassengerType | null {
  const available = getAvailablePassengerTypes(reservation);
  return available[0] ?? null;
}

export function canManagePassengers(state: string | undefined): boolean {
  const key = (state ?? "").toLowerCase();
  return !["canceled", "cancelled", "cancelada"].includes(key);
}

export function getPassengerDataBadge(reservation: Reservation): string | null {
  const state = (reservation.state ?? "").toLowerCase();
  if (!["pending", "pendiente"].includes(state)) return null;

  const progress = passengerProgress(reservation);
  if (progress.totalRequired === 0) return null;

  return progress.isComplete
    ? "Pendiente — datos completos"
    : "Pendiente — faltan datos de pasajeros";
}

export function formatPassengerProgressSummary(reservation: Reservation): string {
  const progress = passengerProgress(reservation);
  return `${progress.totalRegistered}/${progress.totalRequired} registrados`;
}
