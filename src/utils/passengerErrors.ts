import type { AxiosError } from "axios";

export function parsePassengerApiError(error: unknown): string {
  const axiosError = error as AxiosError<{
    message?: string;
    errors?: Record<string, string[]>;
  }>;

  const status = axiosError.response?.status;
  const data = axiosError.response?.data;

  if (status === 403) return "No tienes permiso para gestionar estos pasajeros.";
  if (status === 404) return "La reserva o el pasajero no fue encontrado.";

  if (data?.errors) {
    const messages = Object.values(data.errors).flat();
    if (messages.length > 0) return messages.join(" ");
  }

  if (data?.message) return data.message;

  return "No pudimos guardar los datos del pasajero. Intenta de nuevo.";
}
