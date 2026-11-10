import {
  buildServiceCostLines,
  computePackageSubtotal,
  formatMXN,
} from "../../utils/reservationPricing";

interface ReservationCostBreakdownProps {
  reservation: {
    adults?: number;
    juniors?: number;
    children?: number;
    reserved_seats?: number;
    unit_price_adult?: string | number;
    unit_price_junior?: string | number;
    unit_price_child?: string | number;
    flight?: { client_cost?: string | number | null };
    transport?: { client_cost?: string | number | null };
    hotel?: {
      room_prices?: {
        occupancy_type: string;
        nightly_rate: string | number;
        total_rooms: number | string;
      }[];
    };
  };
  className?: string;
}

export default function ReservationCostBreakdown({
  reservation,
  className = "dr-finance-breakdown",
}: ReservationCostBreakdownProps) {
  const serviceLines = buildServiceCostLines(reservation);

  if (serviceLines.length === 0) {
    return null;
  }

  const packageSubtotal = computePackageSubtotal(reservation);

  return (
    <ul className={className}>
      <li>
        <span>Paquete</span>
        <span>{formatMXN(packageSubtotal)}</span>
      </li>
      {serviceLines.map((line) => (
        <li key={line.label}>
          <span>{line.label}</span>
          <span>{formatMXN(line.amount)}</span>
        </li>
      ))}
    </ul>
  );
}
