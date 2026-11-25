import { Link } from "react-router-dom";
import { Users, ArrowRight } from "lucide-react";
import type { Account, PassengerLedger } from "../../../types/finance";
import { formatMXN } from "../../../utils/reservationPricing";
import {
  passengerPaymentStatusLabel,
  passengerTypeLabel,
} from "../../../utils/passengerPaymentSplit";

interface PassengerPaymentsSummaryProps {
  account: Account;
  ledger: PassengerLedger;
  /** Enlace al detalle de cuenta con la pestaña de pasajeros. */
  manageHref?: string;
  compact?: boolean;
}

export default function PassengerPaymentsSummary({
  account,
  ledger,
  manageHref,
  compact = false,
}: PassengerPaymentsSummaryProps) {
  const passengerCount =
    ledger.passengers.length || account.reservation?.passengers?.length || 0;

  if (passengerCount === 0) {
    return (
      <p className="adm-finance-panel-empty text-sm">
        Agrega pasajeros a la reserva para usar pagos por persona.
      </p>
    );
  }

  const href =
    manageHref ?? `/admin/cuentas/${account.id}?tab=passengers`;

  return (
    <div
      className={`adm-passenger-summary${compact ? " adm-passenger-summary--compact" : ""}`}
    >
      <div className="adm-passenger-summary-head">
        <Users size={16} aria-hidden="true" />
        <h5>Pagos por pasajero</h5>
        {!ledger.enabled && (
          <span className="adm-passenger-summary-chip">Sin reparto</span>
        )}
      </div>

      {!ledger.enabled ? (
        <p className="text-sm text-slate-600 mb-2">
          Divide el total del viaje entre cada viajero y asigna cada abono a quien
          pagó.
        </p>
      ) : (
        <ul className="adm-passenger-summary-list">
          {ledger.passengers.map((row) => (
            <li key={row.passenger_id}>
              <div>
                <strong>
                  {[row.name, row.last_name].filter(Boolean).join(" ")}
                </strong>
                <span className="adm-cell-muted">
                  {" "}
                  · {passengerTypeLabel[row.type] ?? row.type}
                </span>
              </div>
              <div className="adm-passenger-summary-amounts">
                <span>Pendiente {formatMXN(row.balance_due)}</span>
                <span
                  className={`adm-passenger-pay-badge adm-passenger-pay-badge--${row.status}`}
                >
                  {passengerPaymentStatusLabel[row.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link to={href} className="adm-finance-panel-link adm-passenger-summary-link">
        {ledger.enabled ? "Gestionar pagos por pasajero" : "Configurar reparto"}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}