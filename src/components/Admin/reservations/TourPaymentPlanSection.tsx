import { useMemo } from "react";
import { formatAdminMoney } from "../../../utils/adminFormat";
import {
  clampPaymentPlanInstallments,
  equalInstallmentAmounts,
  PAYMENT_PLAN_MAX,
  PAYMENT_PLAN_MIN,
} from "../../../utils/paymentPlan";

interface TourPaymentPlanSectionProps {
  totalClientPrice: number;
  installments: number;
  onInstallmentsChange: (value: number) => void;
  disabled?: boolean;
}

export default function TourPaymentPlanSection({
  totalClientPrice,
  installments,
  onInstallmentsChange,
  disabled = false,
}: TourPaymentPlanSectionProps) {
  const safeCount = clampPaymentPlanInstallments(installments);
  const perPayment = useMemo(() => {
    if (totalClientPrice <= 0 || safeCount < 1) return null;
    const parts = equalInstallmentAmounts(totalClientPrice, safeCount);
    return parts[0] ?? null;
  }, [totalClientPrice, safeCount]);

  const previewParts = useMemo(() => {
    if (totalClientPrice <= 0) return [];
    return equalInstallmentAmounts(totalClientPrice, safeCount);
  }, [totalClientPrice, safeCount]);

  return (
    <div className="qr-payment-plan">
      <h3 className="qr-subpanel-title">Plan de pagos</h3>
      <p className="qr-field-hint qr-grid-span-full">
        Divide el precio total del viaje al cliente (incluye servicios agregados) en
        parcialidades. Al guardar el tour se generará el calendario en la cuenta del
        cliente; los abonos reales se registran en Cuentas como hasta ahora.
      </p>

      <div className="qr-grid qr-grid--3">
        <label className="R-label">
          Número de pagos
          <input
            type="number"
            min={PAYMENT_PLAN_MIN}
            max={PAYMENT_PLAN_MAX}
            step={1}
            className="R-input"
            value={safeCount}
            disabled={disabled}
            onChange={(e) =>
              onInstallmentsChange(clampPaymentPlanInstallments(Number(e.target.value)))
            }
          />
          <span className="qr-field-hint">Entre {PAYMENT_PLAN_MIN} y {PAYMENT_PLAN_MAX}</span>
        </label>

        <div className="qr-profit-box">
          <span className="qr-profit-label">Precio total al cliente</span>
          <span className="qr-profit-value">
            {totalClientPrice > 0 ? `$${formatAdminMoney(totalClientPrice)}` : "—"}
          </span>
        </div>

        <div className="qr-profit-box">
          <span className="qr-profit-label">Importe por parcialidad</span>
          <span className="qr-profit-hint">División inicial equitativa</span>
          <span className="qr-profit-value">
            {perPayment !== null ? `$${formatAdminMoney(perPayment)}` : "—"}
          </span>
        </div>
      </div>

      {previewParts.length > 0 && (
        <div className="qr-payment-plan-preview">
          <p className="pkg-age-prices-label">Vista previa del plan</p>
          <ul className="qr-payment-plan-list">
            {previewParts.map((amount, index) => (
              <li key={index}>
                <span>Pago {index + 1}</span>
                <strong>${formatAdminMoney(amount)}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
