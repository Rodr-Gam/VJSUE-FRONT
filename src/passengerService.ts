import { api } from "./api";
import type { Passenger, PassengerPayload } from "./types/passenger";

type PassengerApiMode = "client" | "admin";

function passengerPaths(reservationId: number, mode: PassengerApiMode) {
  const base =
    mode === "admin"
      ? `/reservations/${reservationId}/passengers`
      : `/mis-reservas/${reservationId}/passengers`;

  return {
    list: base,
    create: base,
    update: (passengerId: number) => `${base}/${passengerId}`,
    delete: (passengerId: number) => `${base}/${passengerId}`,
  };
}

function unwrapPassengerResponse(data: unknown): Passenger {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (record.passenger && typeof record.passenger === "object") {
      return record.passenger as Passenger;
    }
  }
  return data as Passenger;
}

export const passengerService = {
  async getPassengers(
    reservationId: number,
    mode: PassengerApiMode = "client",
  ): Promise<Passenger[]> {
    const { data } = await api.get<Passenger[]>(
      passengerPaths(reservationId, mode).list,
    );
    return data;
  },

  async createPassenger(
    reservationId: number,
    payload: PassengerPayload,
    mode: PassengerApiMode = "client",
  ): Promise<Passenger> {
    const { data } = await api.post(
      passengerPaths(reservationId, mode).create,
      payload,
    );
    return unwrapPassengerResponse(data);
  },

  async updatePassenger(
    reservationId: number,
    passengerId: number,
    payload: PassengerPayload,
    mode: PassengerApiMode = "client",
  ): Promise<Passenger> {
    const { data } = await api.put(
      passengerPaths(reservationId, mode).update(passengerId),
      payload,
    );
    return unwrapPassengerResponse(data);
  },

  async deletePassenger(
    reservationId: number,
    passengerId: number,
    mode: PassengerApiMode = "client",
  ): Promise<void> {
    await api.delete(passengerPaths(reservationId, mode).delete(passengerId));
  },
};
