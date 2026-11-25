import type { Reservation } from "../types/reservation";

function hasTrimmed(value?: string | null): boolean {
  return Boolean(value?.trim());
}

/** Vuelo incluido en la reserva con datos visibles para el cliente. */
export function clientReservationHasFlight(
  flight?: Reservation["flight"] | null,
): boolean {
  if (!flight) return false;

  return (
    hasTrimmed(flight.airline_name) ||
    hasTrimmed(flight.flight_schedule) ||
    hasTrimmed(flight.destination)
  );
}

/** Transporte incluido con datos visibles para el cliente. */
export function clientReservationHasTransport(
  transport?: Reservation["transport"] | null,
): boolean {
  if (!transport) return false;

  return (
    hasTrimmed(transport.company) ||
    hasTrimmed(transport.horary) ||
    hasTrimmed(transport.destination)
  );
}

/** Hotel incluido con nombre u otros datos visibles. */
export function clientReservationHasHotel(
  hotel?: Reservation["hotel"] | null,
): boolean {
  if (!hotel) return false;

  return (
    hasTrimmed(hotel.name) ||
    hasTrimmed(hotel.destination) ||
    hasTrimmed(hotel.check_in_out)
  );
}

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
