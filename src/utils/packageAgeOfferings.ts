import type { TravelPackage } from "../types/package";

export function parsePackageUnitPrice(value: number | string | null | undefined): number {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

/** Categoría visible al cliente si tiene precio unitario > 0. */
export function isPackageAgeCategoryOffered(
  pkg: Pick<TravelPackage, "price_adult" | "price_junior" | "price_child">,
  type: "adults" | "juniors" | "children",
): boolean {
  if (type === "adults") return parsePackageUnitPrice(pkg.price_adult) > 0;
  if (type === "juniors") return parsePackageUnitPrice(pkg.price_junior) > 0;
  return parsePackageUnitPrice(pkg.price_child) > 0;
}

export function getPackageAgeQuotas(pkg: TravelPackage): {
  adults: number;
  juniors: number;
  children: number;
} {
  const stock = Math.max(0, Number(pkg.stock) || 0);
  const adults =
    pkg.quota_adults != null
      ? Math.max(0, Number(pkg.quota_adults))
      : stock;
  const juniors =
    pkg.quota_juniors != null
      ? Math.max(0, Number(pkg.quota_juniors))
      : isPackageAgeCategoryOffered(pkg, "juniors")
        ? stock
        : 0;
  const children =
    pkg.quota_children != null
      ? Math.max(0, Number(pkg.quota_children))
      : isPackageAgeCategoryOffered(pkg, "children")
        ? stock
        : 0;

  return { adults, juniors, children };
}

export function getPackagePassengerCountsForPricing(pkg: TravelPackage): {
  adults: number;
  juniors: number;
  children: number;
} {
  return getPackageAgeQuotas(pkg);
}
