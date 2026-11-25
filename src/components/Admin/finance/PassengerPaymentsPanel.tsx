import { useMemo, useState } from "react";
import { FileDown, Users, Settings2 } from "lucide-react";
import type { Account, PassengerLedger, PassengerLedgerRow } from "../../../types/finance";
import { financeService, getFinanceErrorMessage } from "../../../financeService";
import { formatMXN } from "../../../utils/reservationPricing";
import {
  amountsMatchTotal,
  passengerPaymentStatusLabel,
  passengerTypeLabel,
  splitAmountEqually,
} from "../../../utils/passengerPaymentSplit";
import {
  generateGeneralPassengerAccountPdf,
  generatePassengerAccountPdf,
} from "../../../utils/generatePassengerAccountPdf";
import { formatAdminDate } from "../../../utils/adminFormat";
import { paymentMethodLabel, transactionTypeLabel } from "../../../utils/financeLabels";

interface PassengerPaymentsPanelProps {
  account: Account;
  ledger: PassengerLedger;
  disabled?: boolean;
  onLedgerUpdated: (ledger: PassengerLedger) => void;
  onMessage: (text: string, tipo: "success" | "error") => void;
}

export default function PassengerPaymentsPanel({
  account,
  ledger,
  disabled = false,
  onLedgerUpdated,
  onMessage,
}: PassengerPaymentsPanelProps) {
  const passengers = useMemo(
    () => account.reservation?.passengers ?? [],
    [account.reservation?.passengers],
  );

  const [mode, setMode] = useState<"equal" | "custom">(
    ledger.split_mode === "custom" ? "custom" : "equal",
  );
  const [customAmounts, setCustomAmounts] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    ledger.passengers.forEach((p) => {
      map[p.passenger_id] = p.amount_due > 0 ? p.amount_due.toFixed(2) : "";
    });
    return map;
  });
  const [saving, setSaving] = useState(false);

  const totalNum = Number(account.total_amount) || 0;
  const equalPreview = splitAmountEqually(totalNum, passengers.length);
  const canSaveSplit = !ledger.enabled || ledger.can_edit_shares;
  const paidOnAccount = Number(account.paid_amount) || 0;

  const customTotal = useMemo(() => {
    return passengers.reduce(
      (sum, p) => sum + (parseFloat(customAmounts[p.id] ?? "") || 0),
      0,
    );
  }, [customAmounts, passengers]);

  const handleSaveDistribution = async () => {
    if (!canSaveSplit) {
      onMessage(
        "El reparto ya está activo y hay pagos: no se puede modificar. Edita cada pago para asignar pasajeros.",
        "error",
      );
      return;
    }
    if (passengers.length === 0) {
      onMessage("Registra pasajeros en la reserva antes de repartir.", "error");
      return;
    }

    setSaving(true);
    try {
      const updated =
        mode === "equal"
          ? await financeService.savePassengerShares(account.id, { mode: "equal" })
          : await financeService.savePassengerShares(account.id, {
              mode: "custom",
              shares: passengers.map((p) => ({
                passenger_id: p.id,
                amount_due: parseFloat(customAmounts[p.id] ?? "0") || 0,
              })),
            });
      onLedgerUpdated(updated);
      onMessage(
        "Reparto guardado. Al registrar pagos usa «Todo a [nombre]» en el formulario.",
        "success",
      );
    } catch (err) {
      onMessage(getFinanceErrorMessage(err, "No se pudo guardar el reparto."), "error");
    } finally {
      setSaving(false);
    }
  };

  const applyEqualToCustom = () => {
    const shares = splitAmountEqually(totalNum, passengers.length);
    const map: Record<number, string> = {};
    passengers.forEach((p, i) => {
      map[p.id] = (shares[i] ?? 0).toFixed(2);
    });
    setCustomAmounts(map);
    setMode("custom");
  };

  const renderPassengerRow = (row: PassengerLedgerRow) => (
    <div key={row.passenger_id} className="adm-passenger-pay-card">
      <div className="adm-passenger-pay-card-head">
        <div>
          <strong>
            {[row.name, row.last_name].filter(Boolean).join(" ")}
          </strong>
          <span className="adm-cell-muted">
            {" "}
            · {passengerTypeLabel[row.type] ?? row.type}
          </span>
        </div>
        <span className={`adm-passenger-pay-badge adm-passenger-pay-badge--${row.status}`}>
          {passengerPaymentStatusLabel[row.status]}
        </span>
      </div>
      <dl className="adm-passenger-pay-stats">
        <div>
          <dt>Asignado</dt>
          <dd>{formatMXN(row.amount_due)}</dd>
        </div>
        <div>
          <dt>Pagado</dt>
          <dd className="adm-finance-stat-value--paid">{formatMXN(row.paid_amount)}</dd>
        </div>
        <div>
          <dt>Pendiente</dt>
          <dd className="adm-finance-stat-value--due">{formatMXN(row.balance_due)}</dd>
        </div>
      </dl>

      {row.movements.length > 0 && (
        <div className="adm-passenger-pay-moves">
          <p className="adm-passenger-pay-moves-title">Movimientos</p>
          <ul>
            {row.movements.map((m) => (
              <li key={`${m.partial_payment_id}-${m.paid_at}-${m.amount}`}>
                {formatAdminDate(m.paid_at)} · {formatMXN(m.amount)} ·{" "}
                {paymentMethodLabel[m.payment_method]} · {transactionTypeLabel[m.transaction_type]} ·
                Pago #{m.partial_payment_id}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        className="adm-list-cta adm-list-cta--ghost adm-list-cta--sm"
        onClick={() => generatePassengerAccountPdf(account, row)}
      >
        <FileDown size={14} />
        Descargar estado de cuenta PDF
      </button>
    </div>
  );

  return (
    <section className="adm-account-panel adm-passenger-payments">
      <div className="adm-finance-panel-head">
        <Users size={18} />
        <h3>Pagos por pasajero</h3>
      </div>

      {(!ledger.enabled || ledger.can_edit_shares) && (
        <div className="adm-passenger-setup">
          <p className="adm-cell-muted mb-3">
            Reparte el total del viaje ({formatMXN(totalNum)}) entre los {passengers.length}{" "}
            pasajeros. Después de guardar, cada pago nuevo debe indicar quién pagó.
          </p>
          {paidOnAccount > 0 && !ledger.enabled && (
            <p className="adm-list-alert mb-3" role="note">
              Ya hay {formatMXN(paidOnAccount)} registrados sin reparto por pasajero. Al
              guardar el reparto, esos pagos quedarán como <strong>sin asignar</strong>; en
              los siguientes usa «Todo a [nombre]» o edita los pagos anteriores.
            </p>
          )}

          {passengers.length === 0 ? (
            <p className="adm-empty">No hay pasajeros en esta reserva.</p>
          ) : (
            <>
              <div className="adm-passenger-mode">
                <label className="R-label">
                  Modalidad
                  <select
                    className="R-select"
                    value={mode}
                    disabled={disabled || !canSaveSplit || saving}
                    onChange={(e) =>
                      setMode(e.target.value as "equal" | "custom")
                    }
                  >
                    <option value="equal">A — División automática (equitativa)</option>
                    <option value="custom">B — Asignación personalizada</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="adm-list-cta adm-list-cta--ghost"
                  disabled={disabled || saving}
                  onClick={applyEqualToCustom}
                >
                  <Settings2 size={14} />
                  Prellenar equitativo en personalizado
                </button>
              </div>

              {mode === "equal" ? (
                <ul className="adm-passenger-equal-preview">
                  {passengers.map((p, i) => (
                    <li key={p.id}>
                      {[p.name, p.last_name].filter(Boolean).join(" ")}:{" "}
                      <strong>{formatMXN(equalPreview[i] ?? 0)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="adm-passenger-custom-grid">
                  {passengers.map((p) => (
                    <label key={p.id} className="R-label">
                      {[p.name, p.last_name].filter(Boolean).join(" ")}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="R-input"
                        disabled={disabled || !canSaveSplit || saving}
                        value={customAmounts[p.id] ?? ""}
                        onChange={(e) =>
                          setCustomAmounts((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                      />
                    </label>
                  ))}
                  <p
                    className={
                      amountsMatchTotal(
                        totalNum,
                        passengers.map(
                          (p) => parseFloat(customAmounts[p.id] ?? "") || 0,
                        ),
                      )
                        ? "adm-cell-muted"
                        : "adm-list-alert"
                    }
                  >
                    Suma: {formatMXN(customTotal)} / {formatMXN(totalNum)}
                  </p>
                </div>
              )}

              <button
                type="button"
                className="adm-list-cta"
                disabled={
                  disabled ||
                  !canSaveSplit ||
                  saving ||
                  (mode === "custom" &&
                    !amountsMatchTotal(
                      totalNum,
                      passengers.map(
                        (p) => parseFloat(customAmounts[p.id] ?? "") || 0,
                      ),
                    ))
                }
                onClick={handleSaveDistribution}
              >
                {saving ? "Guardando..." : "Guardar reparto por pasajero"}
              </button>
            </>
          )}
        </div>
      )}

      {ledger.enabled && (
        <>
          {ledger.unassigned_paid > 0.009 && (
            <p className="adm-list-alert mb-3">
              Hay {formatMXN(ledger.unassigned_paid)} en pagos generales sin asignar a un
              pasajero (registros anteriores o pagos sin distribución).
            </p>
          )}

          <div className="adm-passenger-pay-grid">
            {ledger.passengers.map(renderPassengerRow)}
          </div>

          <div className="flex justify-end mt-3">
            <button
              type="button"
              className="adm-list-cta"
              onClick={() => generateGeneralPassengerAccountPdf(account)}
            >
              <FileDown size={16} />
              Descargar estado de cuenta general
            </button>
          </div>

        </>
      )}
    </section>
  );
}