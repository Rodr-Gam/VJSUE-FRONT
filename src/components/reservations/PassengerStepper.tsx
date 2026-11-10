import { Minus, Plus } from "lucide-react";
import { formatMXN } from "../../utils/reservationPricing";

interface PassengerStepperProps {
  label: string;
  unitPrice: number;
  value: number;
  min?: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export default function PassengerStepper({
  label,
  unitPrice,
  value,
  min = 0,
  max,
  disabled = false,
  onChange,
}: PassengerStepperProps) {
  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && value < max;

  return (
    <div className="rp-stepper">
      <div className="rp-stepper-row">
        <div className="rp-stepper-info">
          <span className="rp-stepper-label">{label}</span>
          <span className="rp-stepper-price">{formatMXN(unitPrice)} c/u</span>
        </div>
        <div className="rp-stepper-controls">
          <button
            type="button"
            className="rp-stepper-btn rp-stepper-btn--minus"
            onClick={() => onChange(value - 1)}
            disabled={!canDecrement}
            aria-label={`Quitar ${label}`}
          >
            <Minus size={18} />
          </button>
          <span className="rp-stepper-value" aria-live="polite">
            {value}
          </span>
          <button
            type="button"
            className="rp-stepper-btn rp-stepper-btn--plus"
            onClick={() => onChange(value + 1)}
            disabled={!canIncrement}
            aria-label={`Agregar ${label}`}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
