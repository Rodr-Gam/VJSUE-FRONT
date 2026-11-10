import { useEffect, useState } from "react";
import type {
  ScheduledPayment,
  ScheduledPaymentPayload,
  EditableScheduledStatus,
  UpdateScheduledPaymentPayload,
} from "../../../types/finance";
import { scheduledStatusLabel } from "../../../utils/financeLabels";
import { getFinanceErrorMessage } from "../../../financeService";

function toInputDate(value?: string): string {
  if (!value) return "";
  return value.split("T")[0].split(" ")[0];
}

const defaultForm = (): ScheduledPaymentPayload => ({
  due_date: "",
  amount: 0,
  observations: "",
});

interface ScheduledPaymentFormModalProps {
  isOpen: boolean;
  title: string;
  scheduled?: ScheduledPayment | null;
  allowStatusEdit?: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: UpdateScheduledPaymentPayload) => Promise<void>;
}

export default function ScheduledPaymentFormModal({
  isOpen,
  title,
  scheduled,
  allowStatusEdit = false,
  loading = false,
  onClose,
  onSubmit,
}: ScheduledPaymentFormModalProps) {
  const [form, setForm] = useState<UpdateScheduledPaymentPayload>(defaultForm());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (scheduled) {
      const editableStatus: EditableScheduledStatus =
        scheduled.status === "canceled" ? "canceled" : "pending";
      setForm({
        due_date: toInputDate(scheduled.due_date),
        amount: Number(scheduled.amount),
        observations: scheduled.observations ?? "",
        status: editableStatus,
      });
    } else {
      setForm(defaultForm());
    }
  }, [isOpen, scheduled]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.due_date) {
      setError("La fecha límite es obligatoria.");
      return;
    }

    if (!form.amount || form.amount <= 0) {
      setError("El monto debe ser mayor a cero.");
      return;
    }

    try {
      await onSubmit({
        due_date: form.due_date,
        amount: form.amount,
        observations: form.observations?.trim() || undefined,
        ...(allowStatusEdit && form.status ? { status: form.status } : {}),
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
        aria-labelledby="scheduled-payment-modal-title"
      >
        <h3
          id="scheduled-payment-modal-title"
          className="adm-finance-modal-title"
        >
          {title}
        </h3>

        {error && (
          <div className="adm-list-alert mb-3" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="adm-finance-form-grid">
          <label className="R-label">
            Fecha límite
            <input
              type="date"
              className="R-input"
              value={form.due_date}
              onChange={(e) =>
                setForm({ ...form, due_date: e.target.value })
              }
              required
            />
          </label>

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

          {allowStatusEdit && (
            <label className="R-label">
              Estado
              <select
                className="R-select"
                value={form.status ?? "pending"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as EditableScheduledStatus,
                  })
                }
              >
                <option value="pending">{scheduledStatusLabel.pending}</option>
                <option value="canceled">{scheduledStatusLabel.canceled}</option>
              </select>
              <small className="pg-field-hint">
                Los estados pagado o vencido los calcula el sistema automáticamente.
              </small>
            </label>
          )}

          <label className="R-label">
            Observaciones (opcional)
            <textarea
              className="R-textarea"
              rows={3}
              value={form.observations ?? ""}
              onChange={(e) =>
                setForm({ ...form, observations: e.target.value })
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
