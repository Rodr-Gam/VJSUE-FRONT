import { AlertTriangle, CalendarClock } from "lucide-react";
import type { SupplierTripPaymentAlert } from "../../../types/supplierFinance";

export function SupplierTripPaymentAlertBadge({
  alert,
  compact = false,
}: {
  alert: SupplierTripPaymentAlert;
  compact?: boolean;
}) {
  const urgent = alert.level === "urgent";
  const className = urgent
    ? "adm-supplier-trip-badge adm-supplier-trip-badge--urgent"
    : "adm-supplier-trip-badge adm-supplier-trip-badge--warning";

  if (compact) {
    return (
      <span className={className} title={alert.message}>
        <AlertTriangle size={12} aria-hidden="true" />
        {alert.days_until_departure >= 0
          ? `${alert.days_until_departure}d`
          : "Vencido"}
      </span>
    );
  }

  return (
    <span className={className} title={alert.message}>
      <AlertTriangle size={14} aria-hidden="true" />
      {alert.message}
    </span>
  );
}

export function SupplierTripPaymentAlertBanner({
  count,
  onFilterAlerts,
  filteringAlerts,
}: {
  count: number;
  onFilterAlerts?: () => void;
  filteringAlerts?: boolean;
}) {
  if (count <= 0) return null;

  return (
    <div className="adm-supplier-trip-banner" role="status">
      <CalendarClock size={20} className="adm-supplier-trip-banner-icon" aria-hidden />
      <div className="adm-supplier-trip-banner-text">
        <strong>
          {count} {count === 1 ? "cuenta requiere" : "cuentas requieren"} atención
        </strong>
        <span>
          Saldo pendiente con proveedor y viaje en 3 días o menos (o salida ya
          pasada).
        </span>
      </div>
      {onFilterAlerts && (
        <button
          type="button"
          className="adm-supplier-trip-banner-btn"
          onClick={onFilterAlerts}
        >
          {filteringAlerts ? "Ver todas" : "Ver solo alertas"}
        </button>
      )}
    </div>
  );
}

export function SupplierTripPaymentAlertPanel({
  alert,
}: {
  alert: SupplierTripPaymentAlert;
}) {
  const urgent = alert.level === "urgent";

  return (
    <div
      className={
        urgent
          ? "adm-supplier-trip-panel adm-supplier-trip-panel--urgent"
          : "adm-supplier-trip-panel adm-supplier-trip-panel--warning"
      }
      role="alert"
    >
      <AlertTriangle size={20} aria-hidden="true" />
      <div>
        <p className="adm-supplier-trip-panel-title">Aviso de pago a proveedor</p>
        <p className="adm-supplier-trip-panel-msg">{alert.message}</p>
      </div>
    </div>
  );
}
