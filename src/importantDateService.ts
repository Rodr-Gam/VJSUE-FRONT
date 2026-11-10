import { api } from "./api";
import type {
  GoogleCalendarStatus,
  ImportantDate,
  ImportantDatePayload,
  ImportantDatesListParams,
  PaginatedImportantDates,
} from "./types/importantDate";

export function getImportantDateErrorMessage(
  error: unknown,
  fallback = "No se pudo completar la operación.",
): string {
  if (error && typeof error === "object") {
    const err = error as {
      response?: { data?: { message?: string; errors?: Record<string, string[]> } };
      message?: string;
    };
    if (err.response?.data?.message) return err.response.data.message;
    const fieldErrors = err.response?.data?.errors;
    if (fieldErrors) {
      const first = Object.values(fieldErrors).flat()[0];
      if (first) return first;
    }
    if (err.message) return err.message;
  }
  return fallback;
}

function unwrapPaginated(data: unknown): PaginatedImportantDates {
  if (data && typeof data === "object" && "data" in data) {
    const p = data as PaginatedImportantDates;
    return {
      data: Array.isArray(p.data) ? p.data : [],
      current_page: p.current_page ?? 1,
      last_page: p.last_page ?? 1,
      total: p.total ?? 0,
    };
  }
  return { data: [], current_page: 1, last_page: 1, total: 0 };
}

export const importantDateService = {
  async list(params: ImportantDatesListParams = {}): Promise<PaginatedImportantDates> {
    const { data } = await api.get("/important-dates", { params });
    return unwrapPaginated(data);
  },

  async calendarMonth(
    year: number,
    month: number,
    filters: Omit<ImportantDatesListParams, "calendar" | "year" | "month"> = {},
  ): Promise<ImportantDate[]> {
    const { data } = await api.get<{ items: ImportantDate[] }>("/important-dates", {
      params: {
        calendar: 1,
        year,
        month,
        per_page: 200,
        ...filters,
      },
    });
    return Array.isArray(data.items) ? data.items : [];
  },

  async upcoming(limit = 8): Promise<ImportantDate[]> {
    const { data } = await api.get<ImportantDate[]>("/important-dates/upcoming", {
      params: { limit },
    });
    return Array.isArray(data) ? data : [];
  },

  async get(id: number): Promise<ImportantDate> {
    const { data } = await api.get<ImportantDate>(`/important-dates/${id}`);
    return data;
  },

  async create(payload: ImportantDatePayload): Promise<ImportantDate> {
    const { data } = await api.post<{ important_date: ImportantDate }>(
      "/important-dates",
      payload,
    );
    return data.important_date;
  },

  async update(id: number, payload: ImportantDatePayload): Promise<ImportantDate> {
    const { data } = await api.put<{ important_date: ImportantDate }>(
      `/important-dates/${id}`,
      payload,
    );
    return data.important_date;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/important-dates/${id}`);
  },

  async sync(id: number): Promise<ImportantDate> {
    const { data } = await api.post<{ important_date: ImportantDate }>(
      `/important-dates/${id}/sync`,
    );
    return data.important_date;
  },

  async googleStatus(): Promise<GoogleCalendarStatus> {
    const { data } = await api.get<GoogleCalendarStatus>("/google-calendar/status");
    return data;
  },

  async googleConnectUrl(): Promise<string> {
    const { data } = await api.get<{ url: string }>("/google-calendar/connect-url");
    return data.url;
  },

  async googleDisconnect(): Promise<void> {
    await api.delete("/google-calendar/connection");
  },
};
