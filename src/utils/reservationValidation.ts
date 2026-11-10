interface ValidateReservationSeatsArgs {
  hasPackage: boolean;
  isPrivatePackage: boolean;
  seatsUsed: number;
  stockReal: number;
  totalPassengers: number;
  departureDate: string;
  returnDate: string;
}

export function validateReservationSeats({
  hasPackage,
  isPrivatePackage,
  seatsUsed,
  stockReal,
  totalPassengers,
  departureDate,
  returnDate,
}: ValidateReservationSeatsArgs): string | null {
  if (hasPackage && seatsUsed > stockReal) {
    return `Solo hay ${stockReal} lugares disponibles.`;
  }
  if (isPrivatePackage && totalPassengers < 1) {
    return "Debes asignar al menos un pasajero.";
  }
  if (new Date(returnDate) < new Date(departureDate)) {
    return "La fecha de regreso no puede ser anterior a la fecha de partida.";
  }
  return null;
}