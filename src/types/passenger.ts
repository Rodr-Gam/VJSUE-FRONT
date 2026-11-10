export type PassengerType = "adult" | "junior" | "child";

export interface Passenger {
  id: number;
  reservation_id: number;
  name: string;
  last_name: string;
  birth_date: string;
  nationality: string;
  type: PassengerType;
  created_at?: string;
  updated_at?: string;
}

export interface PassengerPayload {
  name: string;
  last_name: string;
  birth_date: string;
  nationality: string;
  type: PassengerType;
}
