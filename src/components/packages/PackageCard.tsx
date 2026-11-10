import type { TravelPackage } from "../../types/package";
import { getPackageCardImageUrl } from "../../utils/packageImages";
import { formatPackageDate, toDateInputValue } from "../../utils/packageDates";
import { ArrowRight, CalendarDays, Clock, MapPin } from "lucide-react";
import PackageAgeQuotaDisplay from "./PackageAgeQuotaDisplay";
import { getPackageAgeQuotaTotal } from "../../utils/packageAgeQuotaDisplay";
import "../../styles/PackageAgeQuota.css";

interface PackageCardProps {
  pkg: TravelPackage;
  onReservar: (packageId: number) => void;
}

export default function PackageCard({ pkg, onReservar }: PackageCardProps) {
  const adultPriceFormatted = Number(pkg.price_adult || 0).toLocaleString(
    "es-MX",
    { style: "currency", currency: "MXN" },
  );

  const departureDisplay = formatPackageDate(pkg.departure_date);
  const returnDisplay = formatPackageDate(
    toDateInputValue(pkg.return_date) || toDateInputValue(pkg.departure_date),
  );

  const imageUrl = getPackageCardImageUrl(pkg);
  const quotaTotal = getPackageAgeQuotaTotal(pkg);
  const isLowStock = quotaTotal > 0 && quotaTotal <= 5;

  return (
    <article className="cc-package-card">
      <div className="cc-card-image-wrap">
        <img src={imageUrl} alt={pkg.name} className="cc-card-img" loading="lazy" />
        <span className="cc-badge-destino">
          <MapPin size={12} aria-hidden="true" />
          {pkg.city?.name || "Destino sorpresa"}
        </span>
        {isLowStock && (
          <span className="cc-badge-stock">
            ¡Solo {quotaTotal} {quotaTotal === 1 ? "lugar" : "lugares"}!
          </span>
        )}
      </div>

      <div className="cc-card-body">
        <div className="cc-card-head">
          <h3 className="cc-card-title">{pkg.name}</h3>
          {pkg.duration && (
            <span className="cc-card-duration">
              <Clock size={13} aria-hidden="true" />
              {pkg.duration}
            </span>
          )}
        </div>

        <p className="cc-card-desc">
          {pkg.description ||
            "Prepárate para vivir una experiencia inolvidable llena de actividades únicas y momentos mágicos."}
        </p>

        <ul className="cc-card-dates">
          <li>
            <CalendarDays size={14} aria-hidden="true" />
            <span>
              <strong>Salida</strong> {departureDisplay}
            </span>
          </li>
          <li>
            <CalendarDays size={14} aria-hidden="true" />
            <span>
              <strong>Regreso</strong> {returnDisplay}
            </span>
          </li>
        </ul>

        <PackageAgeQuotaDisplay pkg={pkg} variant="catalog" showTotal={false} />

        <div className="cc-card-footer">
          <div className="cc-price-section">
            <span className="cc-price-label">Desde (adulto)</span>
            <span className="cc-price-amount">{adultPriceFormatted}</span>
          </div>
          <button
            type="button"
            className="cc-btn-book"
            onClick={() => onReservar(pkg.id)}
          >
            Reservar ahora
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
