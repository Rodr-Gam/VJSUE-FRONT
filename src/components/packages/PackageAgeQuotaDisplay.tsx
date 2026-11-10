import { Users } from "lucide-react";
import type { TravelPackage } from "../../types/package";
import {
  getPackageAgeQuotaLines,
  getPackageAgeQuotaTotal,
} from "../../utils/packageAgeQuotaDisplay";

interface PackageAgeQuotaDisplayProps {
  pkg: TravelPackage;
  /** Tarjeta del catálogo o bloque en detalle de reserva */
  variant?: "catalog" | "detail";
  showTotal?: boolean;
}

export default function PackageAgeQuotaDisplay({
  pkg,
  variant = "catalog",
  showTotal = true,
}: PackageAgeQuotaDisplayProps) {
  const soldOut = pkg.stock <= 0;
  const lines = getPackageAgeQuotaLines(pkg);
  const total = getPackageAgeQuotaTotal(pkg);
  const rootClass =
    variant === "detail"
      ? "pkg-age-quota pkg-age-quota--detail"
      : "pkg-age-quota pkg-age-quota--catalog";

  if (soldOut) {
    return (
      <div className={`${rootClass} pkg-age-quota--soldout`}>
        <p className="pkg-age-quota-heading">
          <Users size={14} aria-hidden="true" />
          Cupos
        </p>
        <p className="pkg-age-quota-soldout">Agotado</p>
      </div>
    );
  }

  if (lines.length === 0) return null;

  return (
    <div className={rootClass}>
      <p className="pkg-age-quota-heading">
        <Users size={14} aria-hidden="true" />
        Cupos disponibles
      </p>
      <ul className="pkg-age-quota-chips" aria-label="Cupos por categoría">
        {lines.map((line) => (
          <li key={line.key} className="pkg-age-quota-chip">
            <span className="pkg-age-quota-chip-num">{line.count}</span>
            <span className="pkg-age-quota-chip-label">{line.label}</span>
          </li>
        ))}
      </ul>
      {showTotal && lines.length > 1 && (
        <p className="pkg-age-quota-total">
          {total} {total === 1 ? "lugar en total" : "lugares en total"}
        </p>
      )}
    </div>
  );
}
