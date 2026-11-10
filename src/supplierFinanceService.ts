import { api } from "./api";
import { parseApiValidationErrors } from "./utils/apiHelpers";
import type {
  SupplierAccount,
  SupplierAccountsListParams,
  SupplierPayment,
  SupplierPaymentPayload,
  SupplierPaymentResponse,
} from "./types/supplierFinance";
import type { PaginationMeta } from "./types/finance";

export function getSupplierFinanceErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error inesperado.",
): string {
  if (error && typeof error === "object") {
    const err = error as { response?: { status?: number } };
    if (err.response?.status === 403) {
      return "No autorizado. Solo administradores pueden acceder.";
    }
  }

  return parseApiValidationErrors(error, fallback);
}

function normalizeSupplierAccount(account: SupplierAccount): SupplierAccount {
  const payments = account.supplier_payments ?? [];
  const total = Number(account.total_amount) || 0;
  let paid = Number(account.paid_amount);
  if (!Number.isFinite(paid)) {
    paid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }
  const balance = Number.isFinite(Number(account.balance_due))
    ? Number(account.balance_due)
    : Math.max(0, total - paid);

  return {
    ...account,
    supplier_payments: payments,
    paid_amount: paid,
    balance_due: balance,
  };
}

export interface PaginatedSupplierAccountsResponse {
  data: SupplierAccount[];
  meta: PaginationMeta;
  trip_alert_count?: number;
}

function unwrapPage(data: unknown): PaginatedSupplierAccountsResponse {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const items = (Array.isArray(obj.data) ? obj.data : []) as SupplierAccount[];
    const metaRaw = (obj.meta ?? obj) as Record<string, unknown>;

    return {
      data: items.map(normalizeSupplierAccount),
      meta: {
        current_page: Number(metaRaw.current_page ?? 1),
        last_page: Number(metaRaw.last_page ?? 1),
        per_page: Number(metaRaw.per_page ?? (items.length || 20)),
        total: Number(metaRaw.total ?? items.length),
      },
      trip_alert_count:
        obj.trip_alert_count != null ? Number(obj.trip_alert_count) : undefined,
    };
  }

  return {
    data: [],
    meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
  };
}

export const supplierFinanceService = {
  async getAccounts(
    params?: SupplierAccountsListParams,
  ): Promise<PaginatedSupplierAccountsResponse> {
    const { data } = await api.get("/supplier-accounts", {
      params: {
        state: params?.state || undefined,
        search: params?.search || undefined,
        page: params?.page,
        per_page: params?.per_page,
        trip_alert: params?.trip_alert ? 1 : undefined,
      },
    });
    return unwrapPage(data);
  },

  async getAccount(accountId: number): Promise<SupplierAccount> {
    const { data } = await api.get(`/supplier-accounts/${accountId}`);
    return normalizeSupplierAccount(data as SupplierAccount);
  },

  async createPayment(
    accountId: number,
    payload: SupplierPaymentPayload,
  ): Promise<SupplierPaymentResponse> {
    const { data } = await api.post(
      `/supplier-accounts/${accountId}/supplier-payments`,
      payload,
    );
    const response = data as SupplierPaymentResponse;
    if (response.account) {
      response.account = normalizeSupplierAccount(response.account);
    }
    return response;
  },

  async updatePayment(
    accountId: number,
    paymentId: number,
    payload: SupplierPaymentPayload,
  ): Promise<SupplierPaymentResponse> {
    const { data } = await api.put(
      `/supplier-accounts/${accountId}/supplier-payments/${paymentId}`,
      payload,
    );
    const response = data as SupplierPaymentResponse;
    if (response.account) {
      response.account = normalizeSupplierAccount(response.account);
    }
    return response;
  },

  async deletePayment(accountId: number, paymentId: number): Promise<void> {
    await api.delete(
      `/supplier-accounts/${accountId}/supplier-payments/${paymentId}`,
    );
  },
};

export type { SupplierPayment };
