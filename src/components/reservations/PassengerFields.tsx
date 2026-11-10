import PassengerStepper from "./PassengerStepper";
import ReservationSummary from "./ReservationSummary";
import { formatMXN } from "../../utils/reservationPricing";
import type { PassengerCounts } from "../../hooks/usePackagePassengers";

interface PassengerFieldsProps {
  isPrivatePackage: boolean;
  counts: PassengerCounts;
  prices: { adult: number; junior: number; child: number };
  maxFor: (current: number) => number;
  onAdultsChange: (v: number) => void;
  onJuniorsChange: (v: number) => void;
  onChildrenChange: (v: number) => void;
  reservedSeats: number;
  onReservedSeatsChange: (v: number) => void;
  previewTotal: number;
  maxSeats?: number;
}

export default function PassengerFields({
  isPrivatePackage,
  counts,
  prices,
  maxFor,
  onAdultsChange,
  onJuniorsChange,
  onChildrenChange,
  reservedSeats,
  onReservedSeatsChange,
  previewTotal,
  maxSeats,
}: PassengerFieldsProps) {
  if (isPrivatePackage) {
    return (
      <div className="lg:col-span-2">
        <p className="R-label mb-2">Pasajeros (paquete privado)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PassengerStepper
            label="Adultos"
            unitPrice={prices.adult}
            value={counts.adults}
            min={0}
            max={maxFor(counts.adults)}
            onChange={onAdultsChange}
          />
          <PassengerStepper
            label="Juvenil"
            unitPrice={prices.junior}
            value={counts.juniors}
            min={0}
            max={maxFor(counts.juniors)}
            onChange={onJuniorsChange}
          />
          <PassengerStepper
            label="Infantes"
            unitPrice={prices.child}
            value={counts.children}
            min={0}
            max={maxFor(counts.children)}
            onChange={onChildrenChange}
          />
        </div>
        <ReservationSummary counts={counts} prices={prices} compact />
        <p className="text-sm text-gray-600 mt-2">
          Total estimado: <strong>{formatMXN(previewTotal)}</strong>
        </p>
      </div>
    );
  }

  return (
    <label className="R-label">
      Espacios reservados
      <input
        required
        title="¿Cuántos lugares se reservaron?"
        type="number"
        min="0"
        max={maxSeats}
        value={reservedSeats}
        onChange={(e) => {
          const val = Number(e.target.value);
          onReservedSeatsChange(
            maxSeats !== undefined ? Math.min(val, maxSeats) : val,
          );
        }}
        className="R-input"
      />
    </label>
  );
}
