import {
  CalendarRange,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import PackageImageCarousel from "../packages/PackageImageCarousel";
import type { TravelPackage } from "../../types/package";
import {
  formatPackageDate,
  resolvePackageReturnDate,
} from "../../utils/packageDates";
import PackageAgeQuotaDisplay from "./PackageAgeQuotaDisplay";
import { getPackageAgeQuotaTotal } from "../../utils/packageAgeQuotaDisplay";
import "../../styles/PackageAgeQuota.css";

interface PackageDetailViewProps {
  pkg: TravelPackage;
}

export default function PackageDetailView({ pkg }: PackageDetailViewProps) {
  const quotaTotal = getPackageAgeQuotaTotal(pkg);
  const lowStock = quotaTotal > 0 && quotaTotal <= 10;

  return (
    <article className="rp-detail-card">
      <div className="rp-detail-hero">
        <PackageImageCarousel pkg={pkg} className="rp-detail-carousel" />
        <div className="rp-detail-hero-overlay" aria-hidden="true" />
        <span className="rp-detail-badge">
          <MapPin size={14} />
          {pkg.city?.name || "Destino turístico"}
        </span>
      </div>

      <div className="rp-detail-body">
        <p className="rp-detail-eyebrow">Detalle del paquete</p>
        <h1 className="rp-detail-title">{pkg.name}</h1>
        {pkg.description && (
          <p className="rp-detail-desc">{pkg.description}</p>
        )}

        <div className="rp-detail-route">
          <div className="rp-detail-route-point">
            <span className="rp-detail-route-label">Salida</span>
            <span className="rp-detail-route-value">
              {formatPackageDate(pkg.departure_date)}
            </span>
          </div>
          <div className="rp-detail-route-line" aria-hidden="true">
            <span className="rp-detail-route-duration">{pkg.duration}</span>
          </div>
          <div className="rp-detail-route-point rp-detail-route-point--end">
            <span className="rp-detail-route-label">Regreso</span>
            <span className="rp-detail-route-value">
              {formatPackageDate(resolvePackageReturnDate(pkg))}
            </span>
          </div>
        </div>

        <div className="rp-detail-stats">
          <div className="rp-stat">
            <span className="rp-stat-icon">
              <Clock size={20} />
            </span>
            <div>
              <p className="rp-stat-label">Duración</p>
              <p className="rp-stat-value">{pkg.duration || "—"}</p>
            </div>
          </div>
          <div className="rp-stat">
            <span className="rp-stat-icon">
              <CalendarRange size={20} />
            </span>
            <div>
              <p className="rp-stat-label">Salida del viaje</p>
              <p className="rp-stat-value">
                {formatPackageDate(pkg.departure_date)}
              </p>
            </div>
          </div>
          <div className="rp-stat">
            <span className="rp-stat-icon">
              <CalendarRange size={20} />
            </span>
            <div>
              <p className="rp-stat-label">Regreso del viaje</p>
              <p className="rp-stat-value">
                {formatPackageDate(resolvePackageReturnDate(pkg))}
              </p>
            </div>
          </div>
          <div
            className={`rp-stat${lowStock ? " rp-stat--alert" : ""}${pkg.stock <= 0 ? " rp-stat--soldout" : ""}`}
          >
            <span className="rp-stat-icon">
              <Users size={20} />
            </span>
            <div className="rp-stat-quota-wrap">
              <PackageAgeQuotaDisplay
                pkg={pkg}
                variant="detail"
                showTotal={false}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
