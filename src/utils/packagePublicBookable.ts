import type { TravelPackage } from "../types/package";
import { getPackageAgeQuotaTotal } from "./packageAgeQuotaDisplay";
import { toDateInputValue } from "./packageDates";

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Fechas de viaje aún vigentes (no caducado). */
export function packageHasUpcomingTravelDates(pkg: TravelPackage): boolean {
  const today = startOfTodayMs();
  const returnKey = toDateInputValue(pkg.return_date);
  const departureKey = toDateInputValue(pkg.departure_date);

  if (returnKey) {
    return new Date(`${returnKey}T12:00:00`).getTime() >= today;
  }
  if (departureKey) {
    return new Date(`${departureKey}T12:00:00`).getTime() >= today;
  }
  return true;
}

export function isPackagePubliclyBookable(pkg: TravelPackage): boolean {
  if (pkg.status !== "active" || pkg.is_private) return false;
  if (!packageHasUpcomingTravelDates(pkg)) return false;
  if (Number(pkg.stock) <= 0) return false;
  return getPackageAgeQuotaTotal(pkg) > 0;
}