import type { TravelPackage } from "../types/package";
import {
  getPackageAgeQuotas,
  isPackageAgeCategoryOffered,
} from "./packageAgeOfferings";

export type PackageAgeQuotaLine = {
  key: "adults" | "juniors" | "children";
  count: number;
  label: string;
};

const AGE_LABELS: Record<
  PackageAgeQuotaLine["key"],
  { one: string; other: string }
> = {
  adults: { one: "Adulto", other: "Adultos" },
  juniors: { one: "Juvenil", other: "Juveniles" },
  children: { one: "Niño", other: "Niños" },
};

function ageLabel(key: PackageAgeQuotaLine["key"], count: number): string {
  const pair = AGE_LABELS[key];
  return count === 1 ? pair.one : pair.other;
}

/** Líneas de cupo visibles (solo categorías con precio al cliente). */
export function getPackageAgeQuotaLines(
  pkg: TravelPackage,
): PackageAgeQuotaLine[] {
  const quotas = getPackageAgeQuotas(pkg);
  const lines: PackageAgeQuotaLine[] = [];

  if (isPackageAgeCategoryOffered(pkg, "adults")) {
    lines.push({
      key: "adults",
      count: quotas.adults,
      label: ageLabel("adults", quotas.adults),
    });
  }
  if (isPackageAgeCategoryOffered(pkg, "juniors")) {
    lines.push({
      key: "juniors",
      count: quotas.juniors,
      label: ageLabel("juniors", quotas.juniors),
    });
  }
  if (isPackageAgeCategoryOffered(pkg, "children")) {
    lines.push({
      key: "children",
      count: quotas.children,
      label: ageLabel("children", quotas.children),
    });
  }

  if (lines.length === 0 && pkg.stock > 0) {
    const n = Math.max(0, Number(pkg.stock) || 0);
    lines.push({
      key: "adults",
      count: n,
      label: n === 1 ? "Lugar" : "Lugares",
    });
  }

  return lines;
}

export function getPackageAgeQuotaTotal(pkg: TravelPackage): number {
  const lines = getPackageAgeQuotaLines(pkg);
  if (lines.length === 0) return Math.max(0, Number(pkg.stock) || 0);
  return lines.reduce((sum, line) => sum + line.count, 0);
}
