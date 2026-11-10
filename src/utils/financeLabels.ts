import type {
  AccountState,
  PaymentMethod,
  ScheduledPaymentStatus,
  TransactionType,
} from "../types/finance";
import type { SupplierAccountState } from "../types/supplierFinance";

export const accountStateLabel: Record<AccountState, string> = {
  pending: "Pendiente",
  partial: "Pago parcial",
  paid: "Pagado",
  overdue: "Vencido",
  canceled: "Cancelado",
};

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  check: "Cheque",
  other: "Otro",
};

export const transactionTypeLabel: Record<TransactionType, string> = {
  payment: "Pago",
  refund: "Reembolso",
};

export const scheduledStatusLabel: Record<ScheduledPaymentStatus, string> = {
  pending: "Pendiente",
  partial: "Parcial",
  paid: "Pagado",
  overdue: "Vencido",
  canceled: "Cancelado",
};

/** Estados de cuentas a proveedor (sin vencido; no hay plan de pagos). */
export const supplierAccountStateLabel: Record<SupplierAccountState, string> = {
  pending: "Pendiente",
  partial: "Pago parcial",
  paid: "Pagado",
  canceled: "Cancelado",
};

export const supplierAccountStateBadgeClass: Record<
  SupplierAccountState,
  string
> = {
  pending: "adm-badge adm-badge--pending",
  partial: "adm-badge adm-badge--info",
  paid: "adm-badge adm-badge--paid",
  canceled: "adm-badge adm-badge--inactive",
};

export const accountStateBadgeClass: Record<AccountState, string> = {
  pending: "adm-badge adm-badge--pending",
  partial: "adm-badge adm-badge--info",
  paid: "adm-badge adm-badge--paid",
  overdue: "adm-badge adm-badge--cancelled",
  canceled: "adm-badge adm-badge--inactive",
};

export const scheduledStatusBadgeClass: Record<ScheduledPaymentStatus, string> =
  {
    pending: "adm-badge adm-badge--pending",
    partial: "adm-badge adm-badge--info",
    paid: "adm-badge adm-badge--paid",
    overdue: "adm-badge adm-badge--cancelled",
    canceled: "adm-badge adm-badge--inactive",
  };
