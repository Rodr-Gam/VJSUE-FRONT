import type { Passenger } from "./passenger";
import type { TravelPackage } from "./package";

export type ReservationState =
  | "pending"
  | "confirmed"
  | "canceled"
  | "finished"
  | "paid";

export interface CreateReservationPayload {
  package_id: number;
  reservation_date: string;
  departure_date: string;
  return_date: string;
  adults: number;
  juniors: number;
  children: number;
  /** Solo admin; el backend fuerza pending para clientes. */
  state?: ReservationState;
  observations?: string;
}

export interface CreateReservationAdminPayload extends CreateReservationPayload {
  user_id: number;
  state: ReservationState;
  reference_person?: string;
  reserved_seats?: number;
}

export interface Reservation {
  id: number;
  package_id: number;
  reservation_date: string;
  departure_date: string;
  return_date: string;
  adults: number;
  juniors: number;
  children: number;
  reserved_seats: number;
  unit_price_adult?: string | number;
  unit_price_junior?: string | number;
  unit_price_child?: string | number;
  total_amount?: string | number;
  state: ReservationState | string;
  observations?: string | null;
  package?: TravelPackage;
  flight?: {
    airline_name?: string;
    flight_schedule?: string;
    hgdl_key?: string;
    client_cost?: string | number | null;
  };
  transport?: {
    company?: string;
    horary?: string;
    hgdl_key?: string;
    client_cost?: string | number | null;
  };
  hotel?: {
    name?: string;
    destination?: string;
    check_in_out?: string | null;
    hgdl_key?: string;
    room_prices?: {
      occupancy_type: string;
      nightly_rate: string | number;
      total_rooms: number | string;
    }[];
  };
  passengers?: Passenger[];
}

export interface CreateReservationResponse {
  message: string;
  reservation: Reservation;
}

export interface PassengerCounts {
  adults: number;
  juniors: number;
  children: number;
}
