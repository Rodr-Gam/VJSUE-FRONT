import type { AxiosError } from "axios";

export function parseReservationApiError(error: unknown): string {
  const axiosError = error as AxiosError<{
    message?: string;
    errors?: Record<string, string[]>;
  }>;

  const data = axiosError.response?.data;

  if (data?.errors) {
    const messages = Object.values(data.errors).flat();
    if (messages.length > 0) return messages.join(" ");
  }

  if (data?.message) return data.message;

  return "No pudimos procesar tu reserva. Intenta de nuevo.";
}
