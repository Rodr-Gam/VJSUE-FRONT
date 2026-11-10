import { useEffect, useState } from "react";
import type {
  SupplierPayment,
  SupplierPaymentPayload,
} from "../../../types/supplierFinance";
import type { PaymentMethod } from "../../../types/finance";
import { paymentMethodLabel } from "../../../utils/financeLabels";
import { getSupplierFinanceErrorMessage } from "../../../supplierFinanceService";

function toApiDateTime(value: string): string {
  if (!value) return "";
  const normalized = value.replace("T", " ");
  return normalized.length === 16 ? `${normalized}:00` : normalized;
}

function localDateTimeInputValue(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const defaultForm = (): SupplierPaymentPayload => ({
  amount: 0,
  paid_at: toApiDateTime(localDateTimeInputValue()),
  payment_method: "transfer",
  confirmation: "",
  observations: "",
});

interface SupplierPaymentFormModalProps {
  isOpen: boolean;
  title: string;
  balanceDue?: number;
  payment?: SupplierPayment | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: SupplierPaymentPayload) => Promise<void>;
}

export default function SupplierPaymentFormModal({
  isOpen,
  title,
  balanceDue,
  payment,
  loading = false,
  onClose,
  onSubmit,
}: SupplierPaymentFormModalProps) {
  const [form, setForm] = useState<SupplierPaymentPayload>(defaultForm());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (payment) {
      setForm({
        amount: Number(payment.amount),
        paid_at: payment.paid_at,
        payment_method: payment.payment_method,
        confirmation: payment.confirmation ?? "",
        observations: payment.observations ?? "",
      });
    } else {
      setForm(defaultForm());
    }
  }, [isOpen, payment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit({
        ...form,
        paid_at: toApiDateTime(
          form.paid_at.includes("T")
            ? form.paid_at.slice(0, 16)
            : form.paid_at,
        ),
        amount: Number(form.amount),
      });
    } catch (err) {
      setError(getSupplierFinanceErrorMessage(err, "No se pudo guardar el pago."));
    }
  };

  return (
    <div className="adm-finance-modal-backdrop" onClick={onClose} role="presentation">
      <form
        className="adm-finance-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h3 className="adm-finance-modal-title">{title}</h3>
        {balanceDue !== undefined && (
          <p className="text-sm text-slate-600 mb-3">
            Saldo pendiente con proveedores:{" "}
            <strong>${balanceDue.toFixed(2)}</strong>
          </p>
        )}

        <div className="adm-finance-form-grid">
          <label className="R-label">
            Monto
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="R-input"
              required
              value={form.amount || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))
              }
            />
          </label>
          <label className="R-label">
            Fecha y hora
            <input
              type="datetime-local"
              className="R-input"
              required
              value={
                form.paid_at.includes("T")
                  ? form.paid_at.slice(0, 16)
                  : form.paid_at.replace(" ", "T").slice(0, 16)
              }
              onChange={(e) =>
                setForm((f) => ({ ...f, paid_at: e.target.value }))
              }
            />
          </label>
          <label className="R-label">
            Método
            <select
              className="R-input"
              value={form.payment_method}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  payment_method: e.target.value as PaymentMethod,
                }))
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
            Referencia / confirmación
            <input
              type="text"
              className="R-input"
              maxLength={45}
              value={form.confirmation ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, confirmation: e.target.value }))
              }
            />
          </label>
          <label className="R-label">
            Observaciones
            <input
              type="text"
              className="R-input"
              maxLength={500}
              value={form.observations ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, observations: e.target.value }))
              }
            />
          </label>
        </div>

        {error && (
          <p className="text-red-600 text-sm mt-2" role="alert">
            {error}
          </p>
        )}

        <div className="adm-finance-form-actions">
          <button type="button" className="adm-list-cta adm-list-cta--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="adm-list-cta" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
