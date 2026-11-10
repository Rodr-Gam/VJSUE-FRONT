import { api } from "./api";
import type { Client, ClientState, ClientsListResult } from "./types/client";

interface GetClientsParams {
  search?: string;
  state?: ClientState | "";
  frequent?: boolean;
  page?: number;
  per_page?: number;
}

/** Respuesta de GET /users (paginada o arreglo legacy). */
export function unwrapUsersList(data: unknown): Client[] {
  if (Array.isArray(data)) {
    return data as Client[];
  }
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: Client[] }).data;
  }
  return [];
}

function isPaginatedResponse(data: unknown): data is {
  data: Client[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
} {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as { data: unknown }).data) &&
    typeof (data as { current_page: unknown }).current_page === "number"
  );
}

function paginateArray(
  items: Client[],
  page: number,
  perPage: number,
): ClientsListResult {
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(page, 1), lastPage);
  const start = (safePage - 1) * perPage;

  return {
    data: items.slice(start, start + perPage),
    meta: {
      current_page: safePage,
      last_page: lastPage,
      total,
      per_page: perPage,
    },
  };
}

export async function getClients(
  params: GetClientsParams = {},
): Promise<ClientsListResult> {
  const page = params.page ?? 1;
  const perPage = params.per_page ?? 20;

  const res = await api.get("/users", {
    params: {
      search: params.search || undefined,
      state: params.state || undefined,
      frequent: params.frequent ? 1 : undefined,
      page,
      per_page: perPage,
    },
  });

  if (isPaginatedResponse(res.data)) {
    return {
      data: res.data.data,
      meta: {
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        total: res.data.total,
        per_page: res.data.per_page,
      },
    };
  }

  if (Array.isArray(res.data)) {
    let items = res.data as Client[];

    if (params.state) {
      items = items.filter((client) => client.state === params.state);
    }

    if (params.frequent) {
      items = items.filter((client) => client.is_frequent_client);
    }

    return paginateArray(items, page, perPage);
  }

  return {
    data: [],
    meta: { current_page: 1, last_page: 1, total: 0, per_page: perPage },
  };
}

export interface UpdateClientPayload {
  name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  state: ClientState;
}

export async function getClientById(id: number): Promise<Client> {
  const { data } = await api.get<Client>(`/users/${id}`);
  return data;
}

export async function toggleClientFrequent(
  id: number,
): Promise<{ message?: string; user: Client }> {
  const { data } = await api.patch<{ message?: string; user: Client }>(
    `/users/${id}/frequent`,
  );
  return data;
}

export async function updateClient(
  id: number,
  payload: UpdateClientPayload,
): Promise<{ message?: string; user: Client }> {
  const { data } = await api.put<{ message?: string; user: Client }>(
    `/users/${id}`,
    payload,
  );
  return data;
}
