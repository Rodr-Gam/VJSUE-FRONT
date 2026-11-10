import { api } from "./api";
import type {
  CreateReservationPayload,
  CreateReservationResponse,
  Reservation,
} from "./types/reservation";
import type { Account } from "./types/finance";
import {
  extractEmbeddedAccount,
  normalizeAccount,
} from "./utils/financeAccount";

function unwrapAccount(data: unknown): Account {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (obj.account && typeof obj.account === "object") {
      return normalizeAccount(obj.account as Account);
    }
    return normalizeAccount(data as Account);
  }
  return normalizeAccount(data as Account);
}

export const reservationService = {
  async createReservation(
    payload: CreateReservationPayload,
  ): Promise<CreateReservationResponse> {
    const { data } = await api.post<CreateReservationResponse>(
      "/reservations",
      payload,
    );
    return data;
  },

  async getMyReservations(): Promise<Reservation[]> {
    const { data } = await api.get<Reservation[]>("/mis-reservas");
    return data;
  },

  async getMyReservationById(id: number): Promise<Reservation> {
    const { data } = await api.get<Reservation>(`/mis-reservas/${id}`);
    return data;
  },

  extractEmbeddedAccount(data: unknown): Account | null {
    return extractEmbeddedAccount(data);
  },

  async getMyReservationAccount(id: number): Promise<Account | null> {
    try {
      const { data } = await api.get(`/mis-reservas/${id}/account`);
      return unwrapAccount(data);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) return null;
      throw error;
    }
  },
};
