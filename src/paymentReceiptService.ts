import { api } from "./api";
import type {
  ClientReceiptGroup,
  PaymentReceipt,
  PaymentReceiptStatus,
  UploadPaymentReceiptPayload,
} from "./types/paymentReceipt";

export function getPaymentReceiptErrorMessage(
  error: unknown,
  fallback = "No se pudo procesar el comprobante.",
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

export function groupReceiptsByClient(
  receipts: PaymentReceipt[],
): ClientReceiptGroup[] {
  const map = new Map<number, ClientReceiptGroup>();

  for (const receipt of receipts) {
    const userId = receipt.user?.id ?? 0;
    if (!userId) continue;

    const fullName = [receipt.user?.name, receipt.user?.last_name]
      .filter(Boolean)
      .join(" ");

    if (!map.has(userId)) {
      map.set(userId, {
        userId,
        name: fullName || "Cliente",
        email: receipt.user?.email ?? "—",
        receipts: [],
        pendingCount: 0,
      });
    }

    const group = map.get(userId)!;
    group.receipts.push(receipt);
    if (receipt.status === "pending") group.pendingCount += 1;
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount;
    return b.receipts.length - a.receipts.length;
  });
}

export const paymentReceiptService = {
  async getMyReceipts(reservationId: number): Promise<PaymentReceipt[]> {
    const { data } = await api.get<PaymentReceipt[]>(
      `/mis-reservas/${reservationId}/payment-receipts`,
    );
    return Array.isArray(data) ? data : [];
  },

  async uploadMyReceipt(
    reservationId: number,
    payload: UploadPaymentReceiptPayload,
  ): Promise<PaymentReceipt> {
    const formData = new FormData();
    formData.append("file", payload.file);
    if (payload.amount?.trim()) formData.append("amount", payload.amount.trim());
    if (payload.notes?.trim()) formData.append("notes", payload.notes.trim());

    const { data } = await api.post<{ receipt: PaymentReceipt }>(
      `/mis-reservas/${reservationId}/payment-receipts`,
      formData,
    );

    return data.receipt;
  },

  async deleteMyReceipt(
    reservationId: number,
    receiptId: number,
  ): Promise<void> {
    await api.delete(
      `/mis-reservas/${reservationId}/payment-receipts/${receiptId}`,
    );
  },

  async getAllAdminReceipts(params?: {
    search?: string;
    status?: PaymentReceiptStatus | "";
  }): Promise<PaymentReceipt[]> {
    const { data } = await api.get<PaymentReceipt[]>("/payment-receipts", {
      params: {
        search: params?.search || undefined,
        status: params?.status || undefined,
      },
    });
    return Array.isArray(data) ? data : [];
  },

  async getAdminReceipts(reservationId: number): Promise<PaymentReceipt[]> {
    const { data } = await api.get<PaymentReceipt[]>(
      `/reservations/${reservationId}/payment-receipts`,
    );
    return Array.isArray(data) ? data : [];
  },

  async updateReceiptStatus(
    receiptId: number,
    status: PaymentReceiptStatus,
    adminNotes?: string,
  ): Promise<PaymentReceipt> {
    const { data } = await api.patch<{ receipt: PaymentReceipt }>(
      `/payment-receipts/${receiptId}`,
      {
        status,
        admin_notes: adminNotes || null,
      },
    );
    return data.receipt;
  },

  async deleteAdminReceipt(receiptId: number): Promise<void> {
    await api.delete(`/payment-receipts/${receiptId}`);
  },
};
