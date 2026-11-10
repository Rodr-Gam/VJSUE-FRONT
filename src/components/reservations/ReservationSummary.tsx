import type { PassengerCounts } from "../../types/reservation";
import {
  buildPriceBreakdown,
  calculateReservationPreview,
  formatBreakdownLabel,
  formatMXN,
  getTotalPassengers,
} from "../../utils/reservationPricing";

interface ReservationSummaryProps {
  counts: PassengerCounts;
  prices: { adult: number; junior: number; child: number };
  confirmedTotal?: number | string | null;
  compact?: boolean;
}

export default function ReservationSummary({
  counts,
  prices,
  confirmedTotal,
  compact = false,
}: ReservationSummaryProps) {
  const totalPassengers = getTotalPassengers(counts);
  const previewTotal = calculateReservationPreview(counts, prices);
  const lines = buildPriceBreakdown(counts, prices);

  const displayTotal =
    confirmedTotal != null && confirmedTotal !== ""
      ? formatMXN(Number(confirmedTotal))
      : formatMXN(previewTotal);

  if (compact) {
    if (lines.length === 0) return null;

    return (
      <div className="rp-summary-box rp-summary-box--compact">
        <p className="rp-summary-heading">Desglose</p>
        <ul className="rp-summary-lines">
          {lines.map((line) => (
            <li key={line.label}>
              <span>
                {formatBreakdownLabel(line.label, line.quantity)} ×{" "}
                {formatMXN(line.unitPrice)}
              </span>
              <span>{formatMXN(line.subtotal)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="rp-summary-box">
      {lines.length > 0 && (
        <ul className="rp-summary-lines">
          {lines.map((line) => (
            <li key={line.label}>
              {formatBreakdownLabel(line.label, line.quantity)} ×{" "}
              {formatMXN(line.unitPrice)} = {formatMXN(line.subtotal)}
            </li>
          ))}
        </ul>
      )}

      <div className="rp-summary-total">
        <span>
          Total ({totalPassengers}{" "}
          {totalPassengers === 1 ? "persona" : "personas"})
        </span>
        <strong>{displayTotal}</strong>
      </div>
    </div>
  );
}
