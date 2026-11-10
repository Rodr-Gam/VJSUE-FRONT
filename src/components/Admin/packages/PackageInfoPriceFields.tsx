import { formatAdminMoney } from "../../../utils/adminFormat";
import {
  calcPlatformProfitFromCost,
  getPackagePriceBreakdownStatus,
  PLATFORM_PROFIT_PERCENT_OPTIONS,
  validatePackagePriceBreakdown,
  type PackagePriceBreakdownInput,
  type PackagePricePassengerCounts,
  type PlatformProfitPercent,
} from "../../../utils/packageInfoPricing";

interface PackagePriceBreakdownFieldsProps {
  packageTotalCost: string;
  onPackageTotalCostChange: (value: string) => void;
  priceAdult: string;
  onPriceAdultChange: (value: string) => void;
  priceJunior: string;
  onPriceJuniorChange: (value: string) => void;
  priceChild: string;
  onPriceChildChange: (value: string) => void;
  passengerCounts?: PackagePricePassengerCounts;
  platformProfitPercent?: PlatformProfitPercent;
  onPlatformProfitPercentChange?: (value: PlatformProfitPercent) => void;
  disabled?: boolean;
  showInlineValidation?: boolean;
}

export function getPackagePriceBreakdownError(
  input: PackagePriceBreakdownInput,
  onSubmit = false,
): string | null {
  return validatePackagePriceBreakdown(input, onSubmit);
}

/** @deprecated Usa getPackagePriceBreakdownError */
export function getInfoPriceBreakdownError(input: PackagePriceBreakdownInput): string | null {
  return validatePackagePriceBreakdown(input, true);
}

export default function PackagePriceBreakdownFields({
  packageTotalCost,
  onPackageTotalCostChange,
  priceAdult,
  onPriceAdultChange,
  priceJunior,
  onPriceJuniorChange,
  priceChild,
  onPriceChildChange,
  passengerCounts,
  platformProfitPercent = 17,
  onPlatformProfitPercentChange,
  disabled = false,
  showInlineValidation = true,
}: PackagePriceBreakdownFieldsProps) {
  const input: PackagePriceBreakdownInput = {
    packageTotalCost,
    priceAdult,
    priceJunior,
    priceChild,
    passengerCounts,
  };

  const status = getPackagePriceBreakdownStatus(input);
  const breakdownError = showInlineValidation
    ? validatePackagePriceBreakdown(input, false)
    : null;
  const platformProfit = calcPlatformProfitFromCost(
    packageTotalCost,
    platformProfitPercent,
  );
  const profitPercentLabel = `${platformProfitPercent}%`;

  return (
    <div className="pkg-info-prices pkg-price-breakdown">
      <div className="pkg-info-prices-head">
        <h4 className="pkg-info-prices-title">Costo real plataforma y precios por edad</h4>
        <p className="pkg-info-prices-desc">
          El costo real plataforma es opcional; si lo indicas, reparte entre adulto, juvenil y niño.
          La suma no puede superarlo y, al guardar con los tres precios, debe coincidir exactamente.
        </p>
      </div>

      <div className="pkg-platform-profit-row">
        <label className="R-label pkg-info-total pkg-info-total--emphasis">
          Costo real plataforma
          <input
            type="number"
            step="0.01"
            min="0"
            className="R-input"
            value={packageTotalCost}
            onChange={(e) => onPackageTotalCostChange(e.target.value)}
            placeholder="Ej. 20.00"
            disabled={disabled}
          />
        </label>

        <div className="qr-profit-box pkg-auto-profit" aria-live="polite">
          <span className="qr-profit-label">Ganancia</span>
          {onPlatformProfitPercentChange ? (
            <div className="pkg-profit-rate-segment">
              <span className="qr-profit-hint">Porcentaje sobre costo real plataforma</span>
              <div className="qr-segment" role="group" aria-label="Porcentaje de ganancia">
                {PLATFORM_PROFIT_PERCENT_OPTIONS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    className={`qr-segment-btn${
                      platformProfitPercent === pct ? " qr-segment-btn--active" : ""
                    }`}
                    disabled={disabled}
                    onClick={() => onPlatformProfitPercentChange(pct)}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <span className="qr-profit-hint">
              {profitPercentLabel} del costo real plataforma (automático)
            </span>
          )}
          {onPlatformProfitPercentChange ? (
            <span className="qr-profit-hint">
              {profitPercentLabel} del costo real plataforma (automático)
            </span>
          ) : null}
          <span className="qr-profit-value">
            {platformProfit !== null
              ? `$${formatAdminMoney(platformProfit)}`
              : "—"}
          </span>
        </div>
      </div>

      <p className="pkg-age-prices-label">Reparto por edad</p>
      <div className="qr-grid qr-grid--3 pkg-info-grid pkg-age-prices-grid">
        <label className="R-label pkg-age-field">
          Precio niño
          <input
            type="number"
            step="0.01"
            min="0"
            className="R-input"
            value={priceChild}
            onChange={(e) => onPriceChildChange(e.target.value)}
            placeholder="0.00"
            disabled={disabled}
          />
        </label>
        <label className="R-label pkg-age-field">
          Precio juvenil
          <input
            type="number"
            step="0.01"
            min="0"
            className="R-input"
            value={priceJunior}
            onChange={(e) => onPriceJuniorChange(e.target.value)}
            placeholder="0.00"
            disabled={disabled}
          />
        </label>
        <label className="R-label pkg-age-field">
          Precio adulto
          <input
            type="number"
            step="0.01"
            min="0"
            className="R-input"
            value={priceAdult}
            onChange={(e) => onPriceAdultChange(e.target.value)}
            placeholder="0.00"
            disabled={disabled}
          />
        </label>
      </div>

      {status.total !== null && !breakdownError && (
        <p className="pkg-info-hint" role="status">
          Suma asignada: ${status.sum.toFixed(2)} de ${status.total.toFixed(2)}
          {status.remaining !== null && status.remaining > 0.005
            ? ` · Faltan $${status.remaining.toFixed(2)} por repartir`
            : status.remaining !== null && Math.abs(status.remaining) <= 0.005
              ? " · Desglose completo"
              : ""}
        </p>
      )}

      {breakdownError && (
        <p className="pkg-info-error" role="alert">
          {breakdownError}
        </p>
      )}
    </div>
  );
}
