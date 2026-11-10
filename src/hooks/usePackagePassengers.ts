import {
  calculateReservationPreview,
  getTotalPassengers,
} from "../utils/reservationPricing";

export interface PackageLike {
  id: number;
  status: "active" | "inactive";
  stock: number;
  price_adult: number;
  price_junior: number;
  price_child: number;
}

export interface PassengerCounts {
  adults: number;
  juniors: number;
  children: number;
}

interface UsePackagePassengersOptions {
  packages: PackageLike[];
  packageId: number | "";
  counts: PassengerCounts;
  reservedSeats: number;
  reservedCapacity?: number;
}

export function usePackagePassengers({
  packages,
  packageId,
  counts,
  reservedSeats,
  reservedCapacity = 0,
}: UsePackagePassengersOptions) {
  const selectedPkgObj = packages.find((p) => p.id === packageId);
  const isPrivatePackage = selectedPkgObj?.status === "inactive";

  const prices = {
    adult: Number(selectedPkgObj?.price_adult || 0),
    junior: Number(selectedPkgObj?.price_junior || 0),
    child: Number(selectedPkgObj?.price_child || 0),
  };

  const totalPassengers = getTotalPassengers(counts);
  const previewTotal = calculateReservationPreview(counts, prices);

  const stockReal = (selectedPkgObj?.stock ?? 0) + reservedCapacity;
  const seatsUsed = isPrivatePackage ? totalPassengers : Number(reservedSeats);

  const maxFor = (current: number) =>
    current + Math.max(0, stockReal - totalPassengers);

  return {
    selectedPkgObj,
    isPrivatePackage,
    prices,
    totalPassengers,
    previewTotal,
    stockReal,
    seatsUsed,
    maxFor,
  };
}