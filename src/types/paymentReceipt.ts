export type PaymentReceiptStatus = "pending" | "approved" | "rejected";

export interface PaymentReceipt {
  id: number;
  reservation_id: number;
  amount: string | number | null;
  notes: string | null;
  original_name: string;
  url: string;
  status: PaymentReceiptStatus;
  admin_notes: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  reservation?: {
    id: number;
    departure_date?: string;
    package?: { name: string } | null;
  } | null;
}

export interface UploadPaymentReceiptPayload {
  file: File;
  amount?: string;
  notes?: string;
}

export interface ClientReceiptGroup {
  userId: number;
  name: string;
  email: string;
  receipts: PaymentReceipt[];
  pendingCount: number;
}
