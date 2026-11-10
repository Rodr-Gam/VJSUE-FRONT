import { formatMXN } from "../../../utils/reservationPricing";

interface AccountPaymentProgressProps {
  total: number;
  paid: number;
  className?: string;
  /** En tablas: solo barra y porcentaje. */
  compact?: boolean;
}

export default function AccountPaymentProgress({
  total,
  paid,
  className = "",
  compact = false,
}: AccountPaymentProgressProps) {
  const safeTotal = Math.max(0, total);
  const safePaid = Math.min(Math.max(0, paid), safeTotal || paid);
  const balance = Math.max(0, safeTotal - safePaid);
  const percent =
    safeTotal > 0 ? Math.min(100, Math.round((safePaid / safeTotal) * 100)) : 0;

  return (
    <div className={`adm-account-progress${className ? ` ${className}` : ""}`}>
      <div className="adm-account-progress-head">
        <span className="adm-account-progress-pct">{percent}% liquidado</span>
        {!compact && (
          <span className="adm-account-progress-amounts">
            {formatMXN(safePaid)} de {formatMXN(safeTotal)}
          </span>
        )}
      </div>
      <div
        className="adm-account-progress-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso de pago del viaje"
      >
        <div
          className="adm-account-progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      {!compact && balance > 0.004 && (
        <p className="adm-account-progress-balance">
          Saldo pendiente: <strong>{formatMXN(balance)}</strong>
        </p>
      )}
    </div>
  );
}
