import type { Reservation } from "../types/reservation";

export function getHotelCheckInOutLabel(
  hotel?: Reservation["hotel"],
): string {
  const value = hotel?.check_in_out?.trim();
  return value || "Check-in / check-out pendiente";
}

export function getHotelDestinationLabel(
  hotel?: Reservation["hotel"],
): string | undefined {
  return hotel?.destination?.trim() || undefined;
}

/** @deprecated Usar getHotelCheckInOutLabel + getHotelDestinationLabel */
export function getHotelClientSubtitle(
  hotel?: Reservation["hotel"],
): string | undefined {
  const checkInOut = hotel?.check_in_out?.trim();
  if (checkInOut) return checkInOut;

  const destination = hotel?.destination?.trim();
  if (destination) return destination;

  return undefined;
}
