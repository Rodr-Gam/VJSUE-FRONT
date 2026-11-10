import type { PaymentMethod } from "./finance";

export type SupplierAccountState = "pending" | "partial" | "paid" | "canceled";

export interface SupplierBreakdownLine {
  key: string;
  label: string;
  description: string;
  supplier_name?: string | null;
  amount: number | string;
}

export interface SupplierPayment {
  id: number;
  supplier_account_id?: number;
  amount: string | number;
  paid_at: string;
  payment_method: PaymentMethod;
  confirmation?: string | null;
  observations?: string | null;
}

export interface SupplierFinanceReservation {
  id: number;
  departure_date?: string;
  return_date?: string;
  booking_channel?: string | null;
  user?: { name?: string; last_name?: string; email?: string };
  package?: { name?: string; city?: { name?: string } };
}

export type SupplierTripPaymentAlertLevel = "warning" | "urgent";

export interface SupplierTripPaymentAlert {
  days_until_departure: number;
  level: SupplierTripPaymentAlertLevel;
  message: string;
}

export interface SupplierAccount {
  id: number;
  reservation_id: number;
  total_amount: string | number;
  state: SupplierAccountState;
  paid_amount: number | string;
  balance_due: number | string;
  breakdown_lines?: SupplierBreakdownLine[];
  trip_payment_alert?: SupplierTripPaymentAlert | null;
  reservation?: SupplierFinanceReservation;
  supplier_payments?: SupplierPayment[];
}

export interface SupplierPaymentPayload {
  amount: number;
  paid_at: string;
  payment_method: PaymentMethod;
  confirmation?: string;
  observations?: string;
}

export interface SupplierPaymentResponse {
  message: string;
  payment: SupplierPayment;
  account: SupplierAccount;
}

export interface SupplierAccountsListParams {
  state?: SupplierAccountState | "";
  search?: string;
  page?: number;
  per_page?: number;
  /** Solo cuentas con aviso de viaje (≤3 días) y saldo pendiente */
  trip_alert?: boolean;
}
