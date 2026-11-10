export function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  return value.split(" ")[0].split("T")[0];
}

export function validateTripDates(
  departure: string,
  returnDate: string,
): string | null {
  if (!departure || !returnDate) {
    return "Indica la salida y el regreso del viaje.";
  }
  if (new Date(returnDate) < new Date(departure)) {
    return "El regreso del viaje no puede ser anterior a la salida.";
  }
  return null;
}

export function formatPackageDate(value?: string | null): string {
  const iso = toDateInputValue(value);
  if (!iso) return "Por confirmar";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-MX", {
    dateStyle: "long",
  });
}

/** Prefer reservation return; fall back to package when missing or duplicated (legacy). */
export function resolveReservationReturnDate(reserva: {
  departure_date?: string;
  return_date?: string;
  package?: { return_date?: string };
}): string | undefined {
  const departure = toDateInputValue(reserva.departure_date);
  const reservationReturn = toDateInputValue(reserva.return_date);
  const packageReturn = toDateInputValue(reserva.package?.return_date);

  if (packageReturn && (!reservationReturn || reservationReturn === departure)) {
    return packageReturn;
  }

  return reservationReturn || packageReturn || undefined;
}

export function resolvePackageReturnDate(pkg: {
  return_date?: string;
  departure_date?: string;
}): string {
  return toDateInputValue(pkg.return_date) || toDateInputValue(pkg.departure_date);
}
