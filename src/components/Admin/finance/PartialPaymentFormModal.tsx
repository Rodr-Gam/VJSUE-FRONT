import { useEffect, useState } from "react";
import type {
  PartialPayment,
  PartialPaymentPayload,
  TransactionType,
  PaymentMethod,
} from "../../../types/finance";
import {
  paymentMethodLabel,
  transactionTypeLabel,
} from "../../../utils/financeLabels";
import { getFinanceErrorMessage } from "../../../financeService";

function toApiDateTime(value: string): string {
  if (!value) return "";
  const normalized = value.replace("T", " ");
  return normalized.length === 16 ? `${normalized}:00` : normalized;
}

function localDateTimeInputValue(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toInputDateTime(value?: string): string {
  if (!value) return "";
  const part = value.replace(" ", "T").slice(0, 16);
  return part;
}

const defaultForm = (): PartialPaymentPayload => ({
  amount: 0,
  transaction_type: "payment",
  paid_at: toApiDateTime(localDateTimeInputValue()),
  payment_method: "transfer",
  sent_to_supplier: "",
  confirmation: "",
});

interface PartialPaymentFormModalProps {
  isOpen: boolean;
  title: string;
  balanceDue?: number;
  payment?: PartialPayment | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: PartialPaymentPayload) => Promise<void>;
}

export default function PartialPaymentFormModal({
  isOpen,
  title,
  balanceDue,
  payment,
  loading = false,
  onClose,
  onSubmit,
}: PartialPaymentFormModalProps) {
  const [form, setForm] = useState<PartialPaymentPayload>(defaultForm());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (payment) {
      setForm({
        amount: Number(payment.amount),
        transaction_type: payment.transaction_type,
        paid_at: payment.paid_at,
        payment_method: payment.payment_method,
        sent_to_supplier: payment.sent_to_supplier ?? "",
        confirmation: payment.confirmation ?? "",
      });
    } else {
      setForm(defaultForm());
    }
  }, [isOpen, payment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.amount || form.amount <= 0) {
      setError("El monto debe ser mayor a cero.");
      return;
    }

    if (
      form.transaction_type === "payment" &&
      balanceDue !== undefined &&
      form.amount > balanceDue
    ) {
      setError("El pago no puede superar el saldo pendiente.");
      return;
    }

    const paidAtValue = toInputDateTime(form.paid_at) || form.paid_at;
    const paidAtDate = new Date(paidAtValue.replace(" ", "T"));
    if (paidAtDate > new Date()) {
      setError("La fecha del pago no puede ser futura.");
      return;
    }

    try {
      await onSubmit({
        ...form,
        paid_at: toApiDateTime(toInputDateTime(form.paid_at) || form.paid_at),
        sent_to_supplier: form.sent_to_supplier?.trim() || undefined,
        confirmation: form.confirmation?.trim() || undefined,
      });
    } catch (err) {
      setError(getFinanceErrorMessage(err));
    }
  };

  return (
    <div className="adm-finance-modal-backdrop" onClick={onClose}>
      <div
        className="adm-finance-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="partial-payment-modal-title"
      >
        <h3 id="partial-payment-modal-title" className="adm-finance-modal-title">
          {title}
        </h3>

        {balanceDue !== undefined && (
          <p className="adm-cell-muted mb-3">
            Saldo pendiente: ${Number(balanceDue).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
        )}

        {error && (
          <div className="adm-list-alert mb-3" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="adm-finance-form-grid">
          <label className="R-label">
            Monto
            <input
              type="number"
              className="R-input"
              min="0.01"
              step="0.01"
              value={form.amount || ""}
              onChange={(e) =>
                setForm({ ...form, amount: Number(e.target.value) })
              }
              required
            />
          </label>

          <label className="R-label">
            Tipo de transacción
            <select
              className="R-select"
              value={form.transaction_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  transaction_type: e.target.value as TransactionType,
                })
              }
            >
              {Object.entries(transactionTypeLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="R-label">
            Fecha y hora del pago
            <input
              type="datetime-local"
              className="R-input"
              value={toInputDateTime(form.paid_at)}
              onChange={(e) =>
                setForm({ ...form, paid_at: e.target.value })
              }
              required
            />
          </label>

          <label className="R-label">
            Método de pago
            <select
              className="R-select"
              value={form.payment_method}
              onChange={(e) =>
                setForm({
                  ...form,
                  payment_method: e.target.value as PaymentMethod,
                })
              }
            >
              {Object.entries(paymentMethodLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="R-label">
            Enviado a proveedor (opcional)
            <input
              type="text"
              className="R-input"
              value={form.sent_to_supplier ?? ""}
              onChange={(e) =>
                setForm({ ...form, sent_to_supplier: e.target.value })
              }
            />
          </label>

          <label className="R-label">
            Confirmación / referencia (opcional)
            <input
              type="text"
              className="R-input"
              value={form.confirmation ?? ""}
              onChange={(e) =>
                setForm({ ...form, confirmation: e.target.value })
              }
            />
          </label>

          <div className="adm-finance-form-actions">
            <button
              type="button"
              className="adm-list-cta adm-list-cta--ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" className="adm-list-cta" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
