export interface FlexibleReservationFormConfig {
  pageTitle: string;
  heroSubtitle: string;
  submitLabel: string;
  submitLoadingLabel: string;
  apiPath: "/reservations/quick" | "/reservations/tours";
  successFallback: string;
  errorFallback: string;
}

export const QUICK_RESERVATION_FORM_CONFIG: FlexibleReservationFormConfig = {
  pageTitle: "Reserva privada rápida",
  heroSubtitle:
    "Crea paquete privado, reserva, pasajeros y servicios en un solo flujo, con el mismo estilo del panel administrativo.",
  submitLabel: "Crear reserva",
  submitLoadingLabel: "Guardando...",
  apiPath: "/reservations/quick",
  successFallback: "Reserva creada con éxito.",
  errorFallback: "Error al crear la reserva.",
};

export const EDIT_QUICK_RESERVATION_FORM_CONFIG: FlexibleReservationFormConfig = {
  pageTitle: "Editar reserva completa",
  heroSubtitle:
    "Actualiza viaje, precios, pasajeros y servicios (hotel, vuelo y transporte). Tours y reservas privadas usan el mismo formulario.",
  submitLabel: "Guardar cambios",
  submitLoadingLabel: "Guardando...",
  apiPath: "/reservations/quick",
  successFallback: "Reserva actualizada con éxito.",
  errorFallback: "Error al actualizar la reserva.",
};

export const TOUR_RESERVATION_FORM_CONFIG: FlexibleReservationFormConfig = {
  pageTitle: "Crear tour",
  heroSubtitle:
    "Registra un tour con paquete privado, pasajeros y servicios opcionales. Misma experiencia que la reserva rápida, gestionada como tour.",
  submitLabel: "Crear reserva de tour",
  submitLoadingLabel: "Guardando tour...",
  apiPath: "/reservations/tours",
  successFallback: "Reserva de tour creada con éxito.",
  errorFallback: "Error al crear la reserva de tour.",
};
