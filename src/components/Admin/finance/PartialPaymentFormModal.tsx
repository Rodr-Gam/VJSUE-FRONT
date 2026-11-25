import { useEffect, useMemo, useState } from "react";
import type {
  PartialPayment,
  PartialPaymentPayload,
  PassengerLedger,
  PassengerLedgerRow,
  TransactionType,
  PaymentMethod,
} from "../../../types/finance";
import { passengerTypeLabel, splitAmountEqually, amountsMatchTotal } from "../../../utils/passengerPaymentSplit";
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
  passengerLedger?: PassengerLedger | null;
  reservationPassengers?: {
    id: number;
    name: string;
    last_name: string;
    type: "adult" | "junior" | "child";
  }[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: PartialPaymentPayload) => Promise<void>;
}

export default function PartialPaymentFormModal({
  isOpen,
  title,
  balanceDue,
  payment,
  passengerLedger,
  reservationPassengers = [],
  loading = false,
  onClose,
  onSubmit,
}: PartialPaymentFormModalProps) {
  const [form, setForm] = useState<PartialPaymentPayload>(defaultForm());
  const [error, setError] = useState<string | null>(null);
  const [selectedPassengers, setSelectedPassengers] = useState<Record<number, boolean>>({});
  const [passengerAmounts, setPassengerAmounts] = useState<Record<number, string>>({});

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
      const selected: Record<number, boolean> = {};
      const amounts: Record<number, string> = {};
      (payment.passenger_shares ?? []).forEach((share) => {
        selected[share.passenger_id] = true;
        amounts[share.passenger_id] = String(Number(share.amount));
      });
      setSelectedPassengers(selected);
      setPassengerAmounts(amounts);
    } else {
      setForm(defaultForm());
      setSelectedPassengers({});
      setPassengerAmounts({});
    }
  }, [isOpen, payment]);

  const assignablePassengers: PassengerLedgerRow[] = useMemo(() => {
    if (passengerLedger?.passengers?.length) {
      return passengerLedger.passengers;
    }
  return reservationPassengers.map((p) => ({
      passenger_id: p.id,
      name: p.name,
      last_name: p.last_name,
      type: p.type,
      amount_due: 0,
      paid_amount: 0,
      balance_due: 0,
      status: "none" as const,
      movements: [],
    }));
  }, [passengerLedger, reservationPassengers]);

  const splitActive =
    !!passengerLedger?.enabled &&
    assignablePassengers.some((p) => p.amount_due > 0);

  const showPassengerAssign =
    form.transaction_type === "payment" && assignablePassengers.length > 0;

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

    if (showPassengerAssign && !splitActive) {
      setError(
        "Primero guarda el reparto en la pestaña «Pagos por pasajero» (botón Guardar reparto por pasajero).",
      );
      return;
    }

    const allocations =
      splitActive && form.transaction_type === "payment"
        ? assignablePassengers
            .filter((p) => selectedPassengers[p.passenger_id])
            .map((p) => ({
              passenger_id: p.passenger_id,
              amount: parseFloat(passengerAmounts[p.passenger_id] ?? "") || 0,
            }))
            .filter((row) => row.amount > 0)
        : [];

    if (splitActive && form.transaction_type === "payment") {
      if (allocations.length === 0) {
        setError(
          "Esta cuenta tiene reparto por pasajero. Marca a quién pagó y el importe, o usa «Todo este pago a…».",
        );
        return;
      }
      if (!amountsMatchTotal(form.amount, allocations.map((a) => a.amount))) {
        setError(
          "La suma asignada a pasajeros debe coincidir con el monto del pago.",
        );
        return;
      }
    }

    try {
      await onSubmit({
        ...form,
        paid_at: toApiDateTime(toInputDateTime(form.paid_at) || form.paid_at),
        sent_to_supplier: form.sent_to_supplier?.trim() || undefined,
        confirmation: form.confirmation?.trim() || undefined,
        passenger_allocations:
          allocations.length > 0 ? allocations : undefined,
      });
    } catch (err) {
      setError(getFinanceErrorMessage(err));
    }
  };

  const splitAmongSelected = () => {
    const ids = assignablePassengers
      .filter((p) => selectedPassengers[p.passenger_id])
      .map((p) => p.passenger_id);
    if (ids.length === 0 || !form.amount) return;
    const shares = splitAmountEqually(form.amount, ids.length);
    const amounts: Record<number, string> = { ...passengerAmounts };
    ids.forEach((id, i) => {
      amounts[id] = (shares[i] ?? 0).toFixed(2);
    });
    setPassengerAmounts(amounts);
  };

  const assignFullToPassenger = (passengerId: number) => {
    if (!form.amount || form.amount <= 0) {
      setError("Captura primero el monto del pago.");
      return;
    }
    setError(null);
    const only: Record<number, boolean> = { [passengerId]: true };
    setSelectedPassengers(only);
    setPassengerAmounts({
      [passengerId]: Number(form.amount).toFixed(2),
    });
  };

  return (
    <div className="adm-finance-modal-backdrop" onClick={onClose}>
      <div
        className={`adm-finance-modal${showPassengerAssign ? " adm-finance-modal--wide" : ""}`}
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

          {showPassengerAssign && (
              <div className="adm-payment-passenger-split">
                {!splitActive ? (
                  <p className="adm-list-alert mb-2" role="alert">
                    Hay pasajeros en la reserva. Ve a la pestaña{" "}
                    <strong>Pagos por pasajero</strong> y pulsa{" "}
                    <strong>Guardar reparto por pasajero</strong> antes de registrar
                    pagos individuales.
                  </p>
                ) : (
                  <>
                <p className="adm-list-alert mb-2" role="note">
                  <strong>Obligatorio:</strong> indica quién pagó. La suma por
                  pasajero debe ser igual al monto del pago.
                </p>
                {assignablePassengers.map((p) => {
                  const fullName = [p.name, p.last_name]
                    .filter(Boolean)
                    .join(" ");
                  return (
                  <div key={p.passenger_id} className="adm-payment-passenger-row">
                    <input
                      type="checkbox"
                      checked={!!selectedPassengers[p.passenger_id]}
                      onChange={(e) =>
                        setSelectedPassengers((prev) => ({
                          ...prev,
                          [p.passenger_id]: e.target.checked,
                        }))
                      }
                    />
                    <span>
                      {fullName} · {passengerTypeLabel[p.type]} · pend.{" "}
                      ${p.balance_due.toFixed(2)}
                    </span>
                    <div className="adm-payment-passenger-row-actions">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="R-input"
                        disabled={!selectedPassengers[p.passenger_id]}
                        value={passengerAmounts[p.passenger_id] ?? ""}
                        onChange={(e) =>
                          setPassengerAmounts((prev) => ({
                            ...prev,
                            [p.passenger_id]: e.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="adm-list-cta adm-list-cta--ghost adm-list-cta--sm"
                        onClick={() => assignFullToPassenger(p.passenger_id)}
                      >
                        Todo a {p.name}
                      </button>
                    </div>
                  </div>
                );
                })}
                <button
                  type="button"
                  className="adm-list-cta adm-list-cta--ghost adm-list-cta--sm"
                  onClick={splitAmongSelected}
                >
                  Repartir monto entre seleccionados
                </button>
                </>
                )}
              </div>
            )}

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
