import type { PassengerCounts } from "../types/reservation";
import { OCCUPANCY_LABELS } from "./format";

export function formatMXN(amount: number): string {
  return amount.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function getTotalPassengers(counts: PassengerCounts): number {
  return counts.adults + counts.juniors + counts.children;
}

export function calculateReservationPreview(
  counts: PassengerCounts,
  prices: { adult: number; junior: number; child: number },
): number {
  return (
    counts.adults * prices.adult +
    counts.juniors * prices.junior +
    counts.children * prices.child
  );
}

export interface PriceLineItem {
  label: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export function buildPriceBreakdown(
  counts: PassengerCounts,
  prices: { adult: number; junior: number; child: number },
): PriceLineItem[] {
  const lines: PriceLineItem[] = [];

  if (counts.adults > 0) {
    lines.push({
      label: "Adultos",
      quantity: counts.adults,
      unitPrice: prices.adult,
      subtotal: counts.adults * prices.adult,
    });
  }
  if (counts.juniors > 0) {
    lines.push({
      label: "Juvenil",
      quantity: counts.juniors,
      unitPrice: prices.junior,
      subtotal: counts.juniors * prices.junior,
    });
  }
  if (counts.children > 0) {
    lines.push({
      label: "Infantes",
      quantity: counts.children,
      unitPrice: prices.child,
      subtotal: counts.children * prices.child,
    });
  }

  return lines;
}

export function formatBreakdownLabel(label: string, quantity: number): string {
  const labels: Record<string, [string, string]> = {
    Adultos: ["adulto", "adultos"],
    Juvenil: ["juvenil", "juveniles"],
    Infantes: ["infante", "infantes"],
  };
  const pair = labels[label] ?? [label.toLowerCase(), `${label.toLowerCase()}s`];
  return `${quantity} ${quantity === 1 ? pair[0] : pair[1]}`;
}

export function formatPassengerSummary(counts: PassengerCounts): string {
  const parts: string[] = [];

  if (counts.adults > 0) {
    parts.push(`${counts.adults} adulto${counts.adults === 1 ? "" : "s"}`);
  }
  if (counts.juniors > 0) {
    parts.push(
      `${counts.juniors} ${counts.juniors === 1 ? "juvenil" : "juveniles"}`,
    );
  }
  if (counts.children > 0) {
    parts.push(
      `${counts.children} infante${counts.children === 1 ? "" : "s"}`,
    );
  }

  return parts.length > 0 ? parts.join(", ") : "Sin pasajeros";
}

export function getReservationPassengerCounts(reserva: {
  adults?: number;
  juniors?: number;
  children?: number;
  reserved_seats?: number;
}): PassengerCounts {
  const hasBreakdown =
    reserva.adults != null || reserva.juniors != null || reserva.children != null;

  if (hasBreakdown) {
    return {
      adults: Number(reserva.adults ?? 0),
      juniors: Number(reserva.juniors ?? 0),
      children: Number(reserva.children ?? 0),
    };
  }

  return {
    adults: Number(reserva.reserved_seats ?? 0),
    juniors: 0,
    children: 0,
  };
}

export function getServiceClientCost(cost?: string | number | null): number {
  if (cost == null || cost === "") return 0;
  const value = Number(cost);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function computePackageSubtotal(reserva: {
  adults?: number;
  juniors?: number;
  children?: number;
  reserved_seats?: number;
  unit_price_adult?: string | number;
  unit_price_junior?: string | number;
  unit_price_child?: string | number;
}): number {
  const counts = getReservationPassengerCounts(reserva);
  return calculateReservationPreview(counts, {
    adult: Number(reserva.unit_price_adult ?? 0),
    junior: Number(reserva.unit_price_junior ?? 0),
    child: Number(reserva.unit_price_child ?? 0),
  });
}

export interface HotelRoomPrice {
  occupancy_type: string;
  nightly_rate: string | number;
  total_rooms: number | string;
}

export function calcHotelRoomExtrasTotal(
  roomPrices?: HotelRoomPrice[] | null,
): number {
  if (!roomPrices?.length) return 0;

  return roomPrices.reduce((sum, room) => {
    const rate = Number(room.nightly_rate);
    if (!Number.isFinite(rate) || rate <= 0) return sum;

    const rooms = parseInt(String(room.total_rooms), 10);
    const roomCount = Number.isFinite(rooms) && rooms > 0 ? rooms : 1;

    return sum + rate * roomCount;
  }, 0);
}

export function buildHotelRoomExtraLines(hotel?: {
  room_prices?: HotelRoomPrice[];
}): ServiceCostLine[] {
  if (!hotel?.room_prices?.length) return [];

  return hotel.room_prices
    .filter((room) => Number(room.nightly_rate) > 0)
    .map((room) => {
      const rate = Number(room.nightly_rate);
      const rooms = parseInt(String(room.total_rooms), 10) || 1;
      const typeLabel =
        OCCUPANCY_LABELS[room.occupancy_type] ?? room.occupancy_type;
      const roomsLabel = rooms === 1 ? "1 hab." : `${rooms} hab.`;

      return {
        label: `Extra habitación · ${typeLabel} (${roomsLabel})`,
        amount: rate * rooms,
      };
    });
}

export interface ServiceCostLine {
  label: string;
  amount: number;
}

export function buildServiceCostLines(reserva: {
  flight?: { client_cost?: string | number | null };
  transport?: { client_cost?: string | number | null };
  hotel?: { room_prices?: HotelRoomPrice[] };
}): ServiceCostLine[] {
  const lines: ServiceCostLine[] = [];
  const flightCost = getServiceClientCost(reserva.flight?.client_cost);
  const transportCost = getServiceClientCost(reserva.transport?.client_cost);

  if (flightCost > 0) {
    lines.push({ label: "Vuelo", amount: flightCost });
  }
  if (transportCost > 0) {
    lines.push({ label: "Transporte", amount: transportCost });
  }

  lines.push(...buildHotelRoomExtraLines(reserva.hotel));

  return lines;
}

export function computeReservationDisplayTotal(reserva: {
  adults?: number;
  juniors?: number;
  children?: number;
  reserved_seats?: number;
  unit_price_adult?: string | number;
  unit_price_junior?: string | number;
  unit_price_child?: string | number;
  flight?: { client_cost?: string | number | null };
  transport?: { client_cost?: string | number | null };
  hotel?: { room_prices?: HotelRoomPrice[] };
}): number {
  return (
    computePackageSubtotal(reserva) +
    buildServiceCostLines(reserva).reduce((sum, line) => sum + line.amount, 0)
  );
}
