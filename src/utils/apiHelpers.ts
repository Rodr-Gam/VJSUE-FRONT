export function unwrapReservationList<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response;

  if (response && typeof response === "object") {
    const record = response as Record<string, unknown>;

    if (Array.isArray(record.data)) return record.data as T[];

    if (record.data && typeof record.data === "object") {
      const nested = record.data as Record<string, unknown>;
      if (Array.isArray(nested.data)) return nested.data as T[];
    }
  }

  return [];
}

export function parseApiValidationErrors(
  error: unknown,
  fallback = "Ocurrió un error inesperado.",
): string {
  if (error && typeof error === "object") {
    const err = error as {
      response?: {
        status?: number;
        data?: { message?: string; errors?: Record<string, string[]> };
      };
      message?: string;
    };

    const fieldErrors = err.response?.data?.errors;
    if (fieldErrors) {
      const messages = Object.values(fieldErrors).flat();
      if (messages.length > 0) return messages.join(" ");
    }

    const apiMessage = err.response?.data?.message;
    if (apiMessage) return apiMessage;

    if (err.message) return err.message;
  }

  return fallback;
}
