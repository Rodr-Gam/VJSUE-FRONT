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
  /** Precios por persona (vuelo / transporte). */
  perPerson?: boolean;
  passengerCount?: number;
  onPassengerCountChange?: (value: number) => void;
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
  perPerson = false,
  passengerCount = 1,
  onPassengerCountChange,
}: ServiceFinanceFieldsProps) {
  const count = Math.max(1, Math.floor(passengerCount) || 1);
  const unitClient = parseFloat(clientCost) || 0;
  const unitSupplier = parseFloat(supplierPayment) || 0;
  const totalClient = Math.round(unitClient * count * 100) / 100;
  const totalSupplier = Math.round(unitSupplier * count * 100) / 100;
  const ganancia = calcGanancia(
    perPerson ? String(totalClient) : clientCost,
    perPerson ? String(totalSupplier) : supplierPayment,
  );
  const gananciaLibre = calcGananciaLibre(
    perPerson ? String(totalClient) : clientCost,
    perPerson ? String(totalSupplier) : supplierPayment,
    bonusDiscount,
  );

  return (
    <div className="qr-service-finance">
      {perPerson && onPassengerCountChange ? (
        <label className="R-label">
          Cuántas personas
          <input
            type="number"
            min={1}
            step={1}
            className="R-input"
            value={count}
            onChange={(e) =>
              onPassengerCountChange(Math.max(1, Number(e.target.value) || 1))
            }
            disabled={disabled}
          />
          <span className="qr-field-hint">
            Cobro y proveedor abajo son <strong>por persona</strong>; los totales
            se calculan solos.
          </span>
        </label>
      ) : null}

      <label className="R-label">
        {perPerson ? "Precio cliente (por persona)" : "Precio cliente"}
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
        ) : perPerson && unitClient > 0 ? (
          <span className="qr-field-hint">
            Total cobro: ${totalClient.toFixed(2)} ({count} × ${unitClient.toFixed(2)})
          </span>
        ) : null}
      </label>

      <label className="R-label">
        {perPerson ? "Cuánto pagaré a proveedor (por persona)" : "Cuánto pagaré a proveedor"}
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
        ) : perPerson && unitSupplier > 0 ? (
          <span className="qr-field-hint">
            Total proveedor: ${totalSupplier.toFixed(2)} ({count} × $
            {unitSupplier.toFixed(2)})
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
