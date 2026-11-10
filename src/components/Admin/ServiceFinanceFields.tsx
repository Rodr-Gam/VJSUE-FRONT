import { formatAdminMoney } from "../../utils/adminFormat";
import {
  calcGanancia,
  calcGananciaLibre,
} from "../../utils/serviceFinance";
import type { PlatformProfitPercent } from "../../utils/packageInfoPricing";

export interface ServiceFinanceFieldsProps {
  clientCost: string;
  onClientCostChange: (value: string) => void;
  supplierPayment: string;
  onSupplierPaymentChange: (value: string) => void;
  bonusDiscount: string;
  onBonusDiscountChange: (value: string) => void;
  bonusDiscountNote: string;
  onBonusDiscountNoteChange: (value: string) => void;
  disabled?: boolean;
  clientHint?: string;
  /** Si true, el pago a proveedor se calcula fuera y no se edita a mano. */
  supplierPaymentFromPlatform?: boolean;
  platformProfitPercent?: PlatformProfitPercent;
}

export default function ServiceFinanceFields({
  clientCost,
  onClientCostChange,
  supplierPayment,
  onSupplierPaymentChange,
  bonusDiscount,
  onBonusDiscountChange,
  bonusDiscountNote,
  onBonusDiscountNoteChange,
  disabled = false,
  clientHint,
  supplierPaymentFromPlatform = false,
  platformProfitPercent = 17,
}: ServiceFinanceFieldsProps) {
  const ganancia = calcGanancia(clientCost, supplierPayment);
  const gananciaLibre = calcGananciaLibre(
    clientCost,
    supplierPayment,
    bonusDiscount,
  );

  return (
    <div className="qr-service-finance">
      <label className="R-label">
        Precio cliente
        <input
          type="number"
          step="0.01"
          min="0"
          className="R-input"
          value={clientCost}
          onChange={(e) => onClientCostChange(e.target.value)}
          placeholder="Ej. 1500.00"
          disabled={disabled}
        />
        {clientHint ? (
          <span className="qr-field-hint">{clientHint}</span>
        ) : null}
      </label>

      <label className="R-label">
        Cuánto pagaré a proveedor
        <input
          type="number"
          step="0.01"
          min="0"
          className="R-input"
          value={supplierPayment}
          onChange={(e) => onSupplierPaymentChange(e.target.value)}
          placeholder="Ej. 1200.00"
          disabled={disabled || supplierPaymentFromPlatform}
          readOnly={supplierPaymentFromPlatform}
          title={
            supplierPaymentFromPlatform
              ? `Costo real plataforma menos la ganancia (${platformProfitPercent}%)`
              : undefined
          }
        />
        {supplierPaymentFromPlatform ? (
          <span className="qr-field-hint">
            Costo real plataforma − ganancia ({platformProfitPercent}%), calculado
            automáticamente.
          </span>
        ) : null}
      </label>

      <label className="R-label">
        Bono o descuento
        <input
          type="number"
          step="0.01"
          min="0"
          className="R-input"
          value={bonusDiscount}
          onChange={(e) => onBonusDiscountChange(e.target.value)}
          placeholder="Ej. 100.00"
          disabled={disabled}
        />
      </label>

      <label className="R-label qr-grid-span-full">
        Observación (bono o descuento)
        <input
          type="text"
          className="R-input"
          value={bonusDiscountNote}
          onChange={(e) => onBonusDiscountNoteChange(e.target.value)}
          placeholder="Ej. Bono por promoción de temporada"
          disabled={disabled}
        />
      </label>

      <div className="qr-profit-pair qr-grid-span-full">
        <div className="qr-profit-box">
          <span className="qr-profit-label">Ganancia</span>
          <span className="qr-profit-hint">Precio cliente − pago a proveedor</span>
          <span className="qr-profit-value">
            {ganancia !== null ? `$${formatAdminMoney(ganancia)}` : "—"}
          </span>
        </div>
        <div
          className={`qr-profit-box qr-profit-box--libre${
            gananciaLibre !== null && gananciaLibre < 0 ? " qr-profit-box--negative" : ""
          }`}
        >
          <span className="qr-profit-label">Ganancia libre</span>
          <span className="qr-profit-hint">Descontando bono o descuento</span>
          <span className="qr-profit-value">
            {gananciaLibre !== null ? `$${formatAdminMoney(gananciaLibre)}` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
