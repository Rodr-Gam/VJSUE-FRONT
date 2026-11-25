import { api } from "../api";
import {
  multiplyMoneyInput,
  normalizePassengerCount,
  parseMoneyAmount,
} from "./quickReservationFinance";
import { toDateInputValue } from "./packageDates";

export interface QuickEditEntityIds {
  reservationId: number;
  packageId: number;
  flightId: number | null;
  hotelId: number | null;
  transportId: number | null;
}

export interface QuickEditPassengerRow {
  id?: number;
  type: "adult" | "junior" | "child";
  name: string;
  last_name: string;
  birth_date: string;
  nationality: string;
}

export interface QuickEditRoomPriceRow {
  id?: number;
  occupancy_type: "single" | "double" | "triple" | "quadruple" | "suite";
  nightly_rate: string;
  total_rooms: string;
}

function str(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function splitUnitFromTotal(
  total: unknown,
  passengerCount: number,
): { unit: string; count: number } {
  const count = normalizePassengerCount(passengerCount);
  const t = parseMoneyAmount(str(total));
  if (t <= 0) return { unit: "", count: 1 };
  const unit = Math.round((t / count) * 100) / 100;
  return { unit: unit.toFixed(2), count };
}

/** Datos devueltos por GET /reservations/:id mapeados al formulario rápido. */
export function mapReservationToQuickEditForm(data: any) {
  const pkg = data.package ?? {};
  const flight = data.flight;
  const hotel = data.hotel;
  const transport = data.transport;
  const paxForFlight =
    (data.adults ?? 0) + (data.juniors ?? 0) + (data.children ?? 0) || 1;

  const flightSplit = splitUnitFromTotal(flight?.client_cost, paxForFlight);
  const flightProvSplit = splitUnitFromTotal(
    flight?.provider_cost ?? flight?.supplier_payment,
    paxForFlight,
  );
  const transportSplit = splitUnitFromTotal(
    transport?.client_cost,
    paxForFlight,
  );
  const transportProvSplit = splitUnitFromTotal(
    transport?.provider_cost ?? transport?.supplier_payment,
    paxForFlight,
  );

  const passengers: QuickEditPassengerRow[] = (data.passengers ?? []).map(
    (p: any) => ({
      id: p.id,
      type: p.type,
      name: p.name ?? "",
      last_name: p.last_name ?? "",
      birth_date: toDateInputValue(p.birth_date),
      nationality: p.nationality ?? "",
    }),
  );

  const entityIds: QuickEditEntityIds = {
    reservationId: data.id,
    packageId: data.package_id,
    flightId: flight?.id ?? null,
    hotelId: hotel?.id ?? null,
    transportId: transport?.id ?? null,
  };

  return {
    entityIds,
    bookingChannel: str(data.booking_channel),
    clientUserId: data.user_id as number,
    clientLabel: [data.user?.name, data.user?.last_name].filter(Boolean).join(" "),
    cityId: pkg.city_id ?? "",
    duration: str(pkg.duration),
    departureDate: toDateInputValue(data.departure_date ?? pkg.departure_date),
    returnDate: toDateInputValue(data.return_date ?? pkg.return_date),
    reservationDate: toDateInputValue(data.reservation_date),
    priceAdult: str(pkg.price_adult ?? data.unit_price_adult),
    priceJunior: str(pkg.price_junior ?? data.unit_price_junior),
    priceChild: str(pkg.price_child ?? data.unit_price_child),
    packageTotalCost: str(pkg.package_total_cost),
    platformProfitPercent: (pkg.platform_profit_percent === 18 ? 18 : 17) as
      | 17
      | 18,
    packageClientCost: str(pkg.client_cost),
    packageSupplierPayment: str(pkg.supplier_payment ?? pkg.provider_cost),
    packageBonusDiscount: str(pkg.bonus_discount),
    packageBonusDiscountNote: str(pkg.bonus_discount_note),
    reference: str(data.reference_person),
    stateReser: data.state ?? "pending",
    observation: str(data.observations),
    adults: data.adults ?? 0,
    juniors: data.juniors ?? 0,
    children: data.children ?? 0,
    passengers,
    includeHotel: !!hotel,
    hotelName: str(hotel?.name),
    hotelDestination: str(hotel?.destination),
    hotelSupplier: str(hotel?.supplier),
    hotelKey: str(hotel?.hgdl_key),
    hotelBookingSource: str(hotel?.booking_source),
    hotelCheckInOut: str(hotel?.check_in_out),
    hotelObservation: str(hotel?.observations),
    roomPrices: [],
    includeFlight: !!flight,
    flightAirline: str(flight?.airline_name),
    flightDestination: str(flight?.destination),
    flightSchedule: str(flight?.flight_schedule),
    flightKey: str(flight?.hgdl_key),
    flightBookingSource: str(flight?.booking_source),
    flightClientCost: flightSplit.unit,
    flightPassengerCount: flightSplit.count,
    flightSupplierPayment: flightProvSplit.unit,
    flightBonusDiscount: str(flight?.bonus_discount),
    flightBonusDiscountNote: str(flight?.bonus_discount_note),
    flightObservation: str(flight?.observations),
    includeTransport: !!transport,
    transportCompany: str(transport?.company),
    transportDestination: str(transport?.destination),
    transportHorary: str(transport?.horary),
    transportKey: str(transport?.hgdl_key),
    transportBookingSource: str(transport?.booking_source),
    transportClientCost: transportSplit.unit,
    transportPassengerCount: transportSplit.count,
    transportSupplierPayment: transportProvSplit.unit,
    transportBonusDiscount: str(transport?.bonus_discount),
    transportBonusDiscountNote: str(transport?.bonus_discount_note),
    transportObservation: str(transport?.observations),
  };
}

export interface SaveQuickEditInput {
  entityIds: QuickEditEntityIds;
  packageId: number;
  cityId: number | "";
  duration: string;
  departureDate: string;
  returnDate: string;
  reservationDate: string;
  priceAdult: string;
  priceJunior: string;
  priceChild: string;
  packageTotalCost: string;
  platformProfitPercent: number;
  packageClientCost: string;
  packageSupplierPayment: string;
  packageBonusDiscount: string;
  packageBonusDiscountNote: string;
  reference: string;
  stateReser: string;
  observation: string;
  adults: number;
  juniors: number;
  children: number;
  passengers: QuickEditPassengerRow[];
  includeHotel: boolean;
  hotelName: string;
  hotelDestination: string;
  hotelSupplier: string;
  hotelKey: string;
  hotelBookingSource: string;
  hotelCheckInOut: string;
  hotelObservation: string;
  roomPrices: QuickEditRoomPriceRow[];
  includeFlight: boolean;
  flightAirline: string;
  flightDestination: string;
  flightSchedule: string;
  flightKey: string;
  flightBookingSource: string;
  flightClientCost: string;
  flightPassengerCount: number;
  flightSupplierPayment: string;
  flightBonusDiscount: string;
  flightBonusDiscountNote: string;
  flightObservation: string;
  includeTransport: boolean;
  transportCompany: string;
  transportDestination: string;
  transportHorary: string;
  transportKey: string;
  transportBookingSource: string;
  transportClientCost: string;
  transportPassengerCount: number;
  transportSupplierPayment: string;
  transportBonusDiscount: string;
  transportBonusDiscountNote: string;
  transportObservation: string;
}

export async function saveQuickReservationEdit(input: SaveQuickEditInput) {
  const { entityIds } = input;
  const seats = input.adults + input.juniors + input.children;

  await api.put(`/reservations/${entityIds.reservationId}`, {
    package_id: input.packageId,
    reference_person: input.reference.trim() || null,
    reservation_date: input.reservationDate,
    departure_date: input.departureDate,
    return_date: input.returnDate,
    state: input.stateReser,
    observations: input.observation.trim() || null,
    adults: input.adults,
    juniors: input.juniors,
    children: input.children,
  });

  await api.put(`/packages/${entityIds.packageId}`, {
    city_id: input.cityId || undefined,
    duration: input.duration,
    departure_date: input.departureDate,
    return_date: input.returnDate,
    stock: Math.max(seats, 1),
    price_adult: input.priceAdult,
    price_junior: input.priceJunior,
    price_child: input.priceChild,
    package_total_cost: input.packageTotalCost.trim() || null,
    platform_profit_percent: input.platformProfitPercent,
    provider_cost: input.packageSupplierPayment.trim() || null,
    client_cost: input.packageClientCost.trim() || null,
    supplier_payment: input.packageSupplierPayment.trim() || null,
    bonus_discount: input.packageBonusDiscount.trim() || null,
    bonus_discount_note: input.packageBonusDiscountNote.trim() || null,
  });

  await syncPassengers(entityIds.reservationId, input.passengers);

  if (input.includeFlight) {
    const flightCount = normalizePassengerCount(input.flightPassengerCount);
    const flightBody = {
      airline_name: input.flightAirline,
      destination: input.flightDestination,
      flight_schedule: input.flightSchedule,
      hgdl_key: input.flightKey,
      booking_source: input.flightBookingSource || null,
      client_cost:
        multiplyMoneyInput(input.flightClientCost, flightCount) || null,
      provider_cost:
        multiplyMoneyInput(input.flightSupplierPayment, flightCount) ||
        input.flightSupplierPayment.trim(),
      supplier_payment:
        multiplyMoneyInput(input.flightSupplierPayment, flightCount) || null,
      bonus_discount: input.flightBonusDiscount.trim() || null,
      bonus_discount_note: input.flightBonusDiscountNote.trim() || null,
      observations: input.flightObservation || null,
    };
    if (entityIds.flightId) {
      await api.put(`/flights/${entityIds.flightId}`, flightBody);
    } else {
      await api.post("/flights", {
        reservation_id: entityIds.reservationId,
        ...flightBody,
      });
    }
  }

  if (input.includeHotel) {
    const hotelBody = {
      name: input.hotelName,
      destination: input.hotelDestination || null,
      supplier: input.hotelSupplier || null,
      hgdl_key: input.hotelKey || null,
      booking_source: input.hotelBookingSource || null,
      check_in_out: input.hotelCheckInOut || null,
      observations: input.hotelObservation || null,
    };
    let hotelId = entityIds.hotelId;
    if (hotelId) {
      await api.put(`/hotels/${hotelId}`, hotelBody);
    } else {
      const created = await api.post("/hotels", {
        reservation_id: entityIds.reservationId,
        ...hotelBody,
      });
      hotelId = created.data.hotel?.id ?? created.data.id;
    }
    if (hotelId) {
      await syncRoomPrices(
        hotelId,
        input.roomPrices.filter((r) => r.nightly_rate.trim() !== ""),
      );
    }
  }

  if (input.includeTransport) {
    const transportCount = normalizePassengerCount(
      input.transportPassengerCount,
    );
    const transportBody = {
      company: input.transportCompany,
      hgdl_key: input.transportKey,
      destination: input.transportDestination,
      horary: input.transportHorary,
      supplier: input.transportCompany.trim(),
      client_cost:
        multiplyMoneyInput(input.transportClientCost, transportCount) || null,
      provider_cost:
        multiplyMoneyInput(input.transportSupplierPayment, transportCount) ||
        input.transportSupplierPayment.trim(),
      supplier_payment:
        multiplyMoneyInput(input.transportSupplierPayment, transportCount) ||
        null,
      bonus_discount: input.transportBonusDiscount.trim() || null,
      bonus_discount_note: input.transportBonusDiscountNote.trim() || null,
      booking_source: input.transportBookingSource || null,
      observations: input.transportObservation || null,
    };
    if (entityIds.transportId) {
      await api.put(`/transports/${entityIds.transportId}`, transportBody);
    } else {
      await api.post("/transports", {
        reservation_id: entityIds.reservationId,
        ...transportBody,
      });
    }
  }
}

async function syncPassengers(
  reservationId: number,
  rows: QuickEditPassengerRow[],
) {
  const existingRes = await api.get(`/reservations/${reservationId}/passengers`);
  const existing: { id: number }[] = Array.isArray(existingRes.data)
    ? existingRes.data
    : [];
  const keepIds = new Set<number>();

  for (const row of rows) {
    const body = {
      name: row.name.trim(),
      last_name: row.last_name.trim(),
      birth_date: row.birth_date,
      nationality: row.nationality.trim(),
      type: row.type,
    };
    if (row.id) {
      await api.put(
        `/reservations/${reservationId}/passengers/${row.id}`,
        body,
      );
      keepIds.add(row.id);
    } else {
      const created = await api.post(
        `/reservations/${reservationId}/passengers`,
        body,
      );
      if (created.data?.passenger?.id) {
        keepIds.add(created.data.passenger.id);
      }
    }
  }

  for (const p of existing) {
    if (!keepIds.has(p.id)) {
      await api.delete(`/reservations/${reservationId}/passengers/${p.id}`);
    }
  }
}

async function syncRoomPrices(
  hotelId: number,
  rows: QuickEditRoomPriceRow[],
) {
  const hotelRes = await api.get(`/hotels/${hotelId}`);
  const existing: { id: number }[] = hotelRes.data?.room_prices ?? [];
  const keepIds = new Set<number>();

  for (const row of rows) {
    const body = {
      occupancy_type: row.occupancy_type,
      nightly_rate: row.nightly_rate.trim(),
      total_rooms: Math.max(1, parseInt(row.total_rooms, 10) || 1),
    };
    if (row.id) {
      await api.put(`/hotels/${hotelId}/room-prices/${row.id}`, body);
      keepIds.add(row.id);
    } else {
      const created = await api.post(`/hotels/${hotelId}/room-prices`, body);
      const id = created.data?.room_price?.id ?? created.data?.id;
      if (id) keepIds.add(id);
    }
  }

  for (const rp of existing) {
    if (!keepIds.has(rp.id)) {
      await api.delete(`/hotels/${hotelId}/room-prices/${rp.id}`);
    }
  }
}