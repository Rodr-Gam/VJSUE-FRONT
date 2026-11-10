export type ClientState = "active" | "inactive" | "banned";

export interface Client {
  id: number;
  name: string;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  state: ClientState;
  is_frequent_client?: boolean;
  reservations_count?: number;
  created_at?: string;
}

export interface ClientsListMeta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface ClientsListResult {
  data: Client[];
  meta: ClientsListMeta;
}
