export type AccountState =
  | "pending"
  | "partial"
  | "paid"
  | "overdue"
  | "canceled";

export type TransactionType = "payment" | "refund";

export type PaymentMethod =
  | "cash"
  | "transfer"
  | "card"
  | "check"
  | "other";

export type ScheduledPaymentStatus =
  | "pending"
  | "partial"
  | "paid"
  | "overdue"
  | "canceled";

/** Estados editables en abonos programados (solo admin, vía PUT). */
export type EditableScheduledStatus = "pending" | "canceled";

export interface FinanceUser {
  name: string;
  last_name?: string;
  email?: string;
}

export interface FinancePackage {
  name: string;
  city?: { name: string };
}

export type PassengerPaymentStatus = "none" | "partial" | "paid";

export interface PassengerPaymentMovement {
  partial_payment_id: number;
  paid_at: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_type: TransactionType;
  confirmation?: string | null;
}

export interface PassengerLedgerRow {
  passenger_id: number;
  name: string;
  last_name: string;
  type: "adult" | "junior" | "child";
  amount_due: number;
  paid_amount: number;
  balance_due: number;
  status: PassengerPaymentStatus;
  movements: PassengerPaymentMovement[];
}

export interface PassengerLedger {
  enabled: boolean;
  split_mode: "equal" | "custom" | null;
  can_edit_shares: boolean;
  unassigned_paid: number;
  passengers: PassengerLedgerRow[];
}

export interface FinanceReservation {
  id: number;
  booking_channel?: "tour" | "quick_private" | string;
  total_amount?: string;
  state?: string;
  departure_date?: string;
  return_date?: string;
  reservation_date?: string;
  reference_person?: string;
  adults?: number;
  juniors?: number;
  children?: number;
  unit_price_adult?: string | number;
  unit_price_junior?: string | number;
  unit_price_child?: string | number;
  user?: FinanceUser;
  package?: FinancePackage;
  flight?: { client_cost?: string | number | null };
  transport?: { client_cost?: string | number | null };
  passengers?: {
    id: number;
    name: string;
    last_name: string;
    type: "adult" | "junior" | "child";
  }[];
}

export interface PartialPaymentPassengerShare {
  id?: number;
  partial_payment_id?: number;
  passenger_id: number;
  amount: string | number;
}

export interface PartialPayment {
  id: number;
  account_id?: number;
  amount: string | number;
  transaction_type: TransactionType;
  paid_at: string;
  payment_method: PaymentMethod;
  sent_to_supplier?: string | null;
  confirmation?: string | null;
  passenger_shares?: PartialPaymentPassengerShare[];
  created_at?: string;
  updated_at?: string;
}

export interface ScheduledPayment {
  id: number;
  account_id?: number;
  sequence?: number | null;
  due_date: string;
  amount: string | number;
  amount_settled?: string | number | null;
  status: ScheduledPaymentStatus;
  observations?: string | null;
  is_plan_installment?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Account {
  id: number;
  reservation_id: number;
  total_amount: string | number;
  state: AccountState;
  paid_amount: number | string;
  balance_due: number | string;
  payment_plan_installments?: number | null;
  payment_plan_managed?: boolean;
  reservation?: FinanceReservation;
  partial_payments?: PartialPayment[];
  scheduled_payments?: ScheduledPayment[];
  passenger_ledger?: PassengerLedger;
  passenger_split_mode?: "equal" | "custom" | null;
}

export interface AccountsListParams {
  state?: AccountState | "";
  search?: string;
  page?: number;
  per_page?: number;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
}

export interface PaginatedAccountsResponse {
  data: Account[];
  meta: PaginationMeta;
}

/** Solo total_amount — el state lo calcula el backend. */
export interface UpdateAccountPayload {
  total_amount: number;
}

export interface PartialPaymentPassengerAllocation {
  passenger_id: number;
  amount: number;
}

export interface PartialPaymentPayload {
  amount: number;
  transaction_type: TransactionType;
  paid_at: string;
  payment_method: PaymentMethod;
  sent_to_supplier?: string;
  confirmation?: string;
  passenger_allocations?: PartialPaymentPassengerAllocation[];
}

export interface ScheduledPaymentPayload {
  due_date: string;
  amount: number;
  observations?: string;
}

export interface UpdateScheduledPaymentPayload extends ScheduledPaymentPayload {
  status?: EditableScheduledStatus;
}

export interface PartialPaymentResponse {
  message: string;
  payment: PartialPayment;
  account: Account;
  passenger_ledger?: PassengerLedger;
}

export interface ScheduledPaymentResponse {
  message?: string;
  scheduled_payment?: ScheduledPayment;
  account?: Account;
}
