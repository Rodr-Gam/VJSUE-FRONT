import { api } from "./api";
import { parseApiValidationErrors } from "./utils/apiHelpers";
import { normalizeAccount, normalizeAccounts } from "./utils/financeAccount";
import type {
  Account,
  AccountsListParams,
  PaginatedAccountsResponse,
  PartialPayment,
  PartialPaymentPayload,
  PartialPaymentResponse,
  ScheduledPayment,
  ScheduledPaymentPayload,
  ScheduledPaymentResponse,
  UpdateAccountPayload,
  UpdateScheduledPaymentPayload,
  PaginationMeta,
} from "./types/finance";

export function getFinanceErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error inesperado.",
): string {
  if (error && typeof error === "object") {
    const err = error as { response?: { status?: number } };

    if (err.response?.status === 403) {
      return "No autorizado. Solo administradores pueden acceder a finanzas.";
    }

    if (err.response?.status === 404) {
      return "El recurso solicitado no fue encontrado.";
    }

    const message = parseApiValidationErrors(error, "");
    if (message) {
      if (
        message.includes("Base table or view not found") ||
        message.includes("doesn't exist")
      ) {
        return "Las tablas de finanzas no existen en la base de datos. Ejecuta las migraciones del backend: php artisan migrate";
      }
      return message;
    }
  }

  return parseApiValidationErrors(error, fallback);
}

function unwrapAccountsPage(data: unknown): PaginatedAccountsResponse {
  if (Array.isArray(data)) {
    const items = normalizeAccounts(data as Account[]);
    return {
      data: items,
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: items.length,
        total: items.length,
      },
    };
  }

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const items = normalizeAccounts(
      (Array.isArray(obj.data)
        ? obj.data
        : Array.isArray(obj.accounts)
          ? obj.accounts
          : []) as Account[],
    );

    const metaRaw = (obj.meta ?? {}) as Record<string, unknown>;
    const meta: PaginationMeta = {
      current_page: Number(metaRaw.current_page ?? 1),
      last_page: Number(metaRaw.last_page ?? 1),
      per_page: Number(metaRaw.per_page ?? (items.length || 20)),
      total: Number(metaRaw.total ?? items.length),
      from: metaRaw.from != null ? Number(metaRaw.from) : null,
      to: metaRaw.to != null ? Number(metaRaw.to) : null,
    };

    return { data: items, meta };
  }

  return {
    data: [],
    meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
  };
}

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

function unwrapPartialPayments(data: unknown): PartialPayment[] {
  if (Array.isArray(data)) return data as PartialPayment[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.partial_payments)) {
      return obj.partial_payments as PartialPayment[];
    }
    if (Array.isArray(obj.partialPayments)) {
      return obj.partialPayments as PartialPayment[];
    }
    if (Array.isArray(obj.data)) return obj.data as PartialPayment[];
  }
  return [];
}

function unwrapScheduledPayments(data: unknown): ScheduledPayment[] {
  if (Array.isArray(data)) return data as ScheduledPayment[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.scheduled_payments)) {
      return obj.scheduled_payments as ScheduledPayment[];
    }
    if (Array.isArray(obj.scheduledPayments)) {
      return obj.scheduledPayments as ScheduledPayment[];
    }
    if (Array.isArray(obj.data)) return obj.data as ScheduledPayment[];
  }
  return [];
}

export const financeService = {
  async getAccounts(
    params?: AccountsListParams,
  ): Promise<PaginatedAccountsResponse> {
    const { data } = await api.get("/accounts", {
      params: {
        state: params?.state || undefined,
        search: params?.search || undefined,
        page: params?.page,
        per_page: params?.per_page,
      },
    });
    return unwrapAccountsPage(data);
  },

  async getAccount(accountId: number): Promise<Account> {
    const { data } = await api.get(`/accounts/${accountId}`);
    return unwrapAccount(data);
  },

  async getAccountByReservation(reservationId: number): Promise<Account | null> {
    try {
      const { data } = await api.get(`/reservations/${reservationId}/account`);
      return unwrapAccount(data);
    } catch (error: unknown) {
      const err = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      const status = err.response?.status;
      const message = err.response?.data?.message ?? "";

      if (status === 404) return null;

      if (
        status === 500 &&
        message.includes("No query results for model") &&
        message.includes("Reservation")
      ) {
        return null;
      }

      throw error;
    }
  },

  async updateAccount(
    accountId: number,
    payload: UpdateAccountPayload,
  ): Promise<Account> {
    const { data } = await api.put(`/accounts/${accountId}`, {
      total_amount: payload.total_amount,
    });
    return unwrapAccount(data);
  },

  async getPartialPayments(accountId: number): Promise<PartialPayment[]> {
    const { data } = await api.get(
      `/accounts/${accountId}/partial-payments`,
    );
    return unwrapPartialPayments(data);
  },

  async createPartialPayment(
    accountId: number,
    payload: PartialPaymentPayload,
  ): Promise<PartialPaymentResponse> {
    const { data } = await api.post(
      `/accounts/${accountId}/partial-payments`,
      payload,
    );
    const response = data as PartialPaymentResponse;
    if (response.account) {
      response.account = normalizeAccount(response.account);
    }
    return response;
  },

  async updatePartialPayment(
    accountId: number,
    paymentId: number,
    payload: PartialPaymentPayload,
  ): Promise<PartialPaymentResponse> {
    const { data } = await api.put(
      `/accounts/${accountId}/partial-payments/${paymentId}`,
      payload,
    );
    const response = data as PartialPaymentResponse;
    if (response.account) {
      response.account = normalizeAccount(response.account);
    }
    return response;
  },

  async deletePartialPayment(
    accountId: number,
    paymentId: number,
  ): Promise<void> {
    await api.delete(`/accounts/${accountId}/partial-payments/${paymentId}`);
  },

  async getScheduledPayments(accountId: number): Promise<ScheduledPayment[]> {
    const { data } = await api.get(
      `/accounts/${accountId}/scheduled-payments`,
    );
    return unwrapScheduledPayments(data);
  },

  async createScheduledPayment(
    accountId: number,
    payload: ScheduledPaymentPayload,
  ): Promise<ScheduledPaymentResponse> {
    const { data } = await api.post(
      `/accounts/${accountId}/scheduled-payments`,
      payload,
    );
    return data as ScheduledPaymentResponse;
  },

  async updateScheduledPayment(
    accountId: number,
    scheduledId: number,
    payload: UpdateScheduledPaymentPayload,
  ): Promise<ScheduledPaymentResponse> {
    const body: UpdateScheduledPaymentPayload = {
      due_date: payload.due_date,
      amount: payload.amount,
      observations: payload.observations,
    };
    if (payload.status === "pending" || payload.status === "canceled") {
      body.status = payload.status;
    }

    const { data } = await api.put(
      `/accounts/${accountId}/scheduled-payments/${scheduledId}`,
      body,
    );
    return data as ScheduledPaymentResponse;
  },

  async deleteScheduledPayment(
    accountId: number,
    scheduledId: number,
  ): Promise<void> {
    await api.delete(
      `/accounts/${accountId}/scheduled-payments/${scheduledId}`,
    );
  },
};
