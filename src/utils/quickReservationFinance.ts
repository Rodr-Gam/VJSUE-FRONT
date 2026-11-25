import { formatMXN } from "./reservationPricing";
import { calcServiceProfit } from "./serviceProfit";

export interface QuickReservationRoomPriceInput {
  occupancy_type: string;
  nightly_rate: string;
  total_rooms: string;
}

export interface QuickReservationFinanceInput {
  adults: number;
  juniors: number;
  children: number;
  priceAdult: string;
  priceJunior: string;
  priceChild: string;
  packagePlatformCost?: string;
  packageSupplierPayment: string;
  packageClientCost?: string;
  packageBonusDiscount?: string;
  includeFlight: boolean;
  flightSupplierPayment: string;
  flightClientCost: string;
  flightPassengerCount?: number;
  flightBonusDiscount?: string;
  includeTransport: boolean;
  transportSupplierPayment: string;
  transportClientCost: string;
  transportPassengerCount?: number;
  transportBonusDiscount?: string;
  includeHotel: boolean;
  roomPrices?: QuickReservationRoomPriceInput[];
}

export interface QuickReservationFinanceLine {
  key: string;
  label: string;
  detail?: string;
  platformCost: number;
  bonusDiscount: number;
  providerCost: number;
  clientCost: number;
  /** Ganancia sin descontar bono */
  profitGross: number;
  /** Ganancia libre (después de bono) */
  profitNet: number;
  included: boolean;
}

export interface QuickReservationFinanceSummary {
  lines: QuickReservationFinanceLine[];
  servicesSubtotal: {
    platformCost: number;
    bonusDiscount: number;
    providerCost: number;
    clientCost: number;
    profitGross: number;
    profitNet: number;
    hasServices: boolean;
  };
  totals: {
    platformCost: number;
    bonusDiscount: number;
    providerCost: number;
    clientCost: number;
    profitGross: number;
    profitNet: number;
  };
}

export function parseMoneyAmount(value: string): number {
  const amount = parseFloat(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function parseAmount(value: string): number {
  return parseMoneyAmount(value);
}

export function normalizePassengerCount(value: number | undefined): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function multiplyMoneyInput(value: string, count: number): string {
  const unit = parseMoneyAmount(value);
  const qty = normalizePassengerCount(count);
  if (unit <= 0) return "";
  return (Math.round(unit * qty * 100) / 100).toFixed(2);
}

function perPersonServiceAmounts(
  included: boolean,
  unitProviderCost: string,
  unitClientCost: string,
  bonusDiscount: string,
  passengerCount: number,
): Pick<
  QuickReservationFinanceLine,
  | "platformCost"
  | "bonusDiscount"
  | "providerCost"
  | "clientCost"
  | "profitGross"
  | "profitNet"
  | "detail"
> {
  const count = normalizePassengerCount(passengerCount);
  const unitProvider = parseAmount(unitProviderCost);
  const unitClient = parseAmount(unitClientCost);

  if (!included) {
    return {
      platformCost: 0,
      bonusDiscount: 0,
      providerCost: 0,
      clientCost: 0,
      profitGross: 0,
      profitNet: 0,
    };
  }

  const provider = Math.round(unitProvider * count * 100) / 100;
  const client = Math.round(unitClient * count * 100) / 100;
  const bonus = parseAmount(bonusDiscount);
  const profitGross = calcServiceProfit(client, provider) ?? client - provider;
  const profitNet = profitGross - bonus;

  const detail =
    count > 1 || unitClient > 0 || unitProvider > 0
      ? `${count} pers. × ${formatMXN(unitClient)} cobro · ${formatMXN(unitProvider)} proveedor c/u`
      : undefined;

  return {
    platformCost: 0,
    bonusDiscount: bonus,
    providerCost: provider,
    clientCost: client,
    profitGross,
    profitNet,
    detail,
  };
}

function serviceAmounts(
  included: boolean,
  providerCost: string,
  clientCost: string,
  bonusDiscount = "",
): Pick<
  QuickReservationFinanceLine,
  | "platformCost"
  | "bonusDiscount"
  | "providerCost"
  | "clientCost"
  | "profitGross"
  | "profitNet"
> {
  if (!included) {
    return {
      platformCost: 0,
      bonusDiscount: 0,
      providerCost: 0,
      clientCost: 0,
      profitGross: 0,
      profitNet: 0,
    };
  }

  const provider = parseAmount(providerCost);
  const client = parseAmount(clientCost);
  const bonus = parseAmount(bonusDiscount);
  const profitGross = calcServiceProfit(client, provider) ?? client - provider;
  const profitNet = profitGross - bonus;

  return {
    platformCost: 0,
    bonusDiscount: bonus,
    providerCost: provider,
    clientCost: client,
    profitGross,
    profitNet,
  };
}

export function calcHotelRoomExtrasTotal(
  roomPrices: QuickReservationRoomPriceInput[],
): number {
  return roomPrices.reduce((sum, room) => {
    const rate = parseAmount(room.nightly_rate);
    if (rate <= 0) return sum;

    const rooms = parseInt(room.total_rooms, 10);
    const roomCount = Number.isFinite(rooms) && rooms > 0 ? rooms : 1;

    return sum + rate * roomCount;
  }, 0);
}

function buildHotelRoomExtrasDetail(
  roomPrices: QuickReservationRoomPriceInput[],
): string | undefined {
  const parts = roomPrices
    .filter((room) => parseAmount(room.nightly_rate) > 0)
    .map((room) => {
      const rate = parseAmount(room.nightly_rate);
      const rooms = parseInt(room.total_rooms, 10) || 1;
      return `${room.occupancy_type}: ${rooms} hab. × ${formatMXN(rate)} extra`;
    });

  if (parts.length === 0) {
    return "Sin cargo extra de habitaciones";
  }

  return parts.join(" · ");
}

export function buildQuickReservationFinanceSummary(
  input: QuickReservationFinanceInput,
): QuickReservationFinanceSummary {
  const adultUnit = parseAmount(input.priceAdult);
  const juniorUnit = parseAmount(input.priceJunior);
  const childUnit = parseAmount(input.priceChild);

  const packageClientFromPassengers =
    input.adults * adultUnit +
    input.juniors * juniorUnit +
    input.children * childUnit;

  const packageClientOverride = parseAmount(input.packageClientCost ?? "");
  const packageClient =
    packageClientOverride > 0
      ? packageClientOverride
      : packageClientFromPassengers;

  const packageDetails: string[] = [];
  if (input.adults > 0) {
    packageDetails.push(`${input.adults} adulto(s) × ${formatMXN(adultUnit)}`);
  }
  if (input.juniors > 0) {
    packageDetails.push(`${input.juniors} junior(s) × ${formatMXN(juniorUnit)}`);
  }
  if (input.children > 0) {
    packageDetails.push(`${input.children} niño(s) × ${formatMXN(childUnit)}`);
  }

  const flight = perPersonServiceAmounts(
    input.includeFlight,
    input.flightSupplierPayment,
    input.flightClientCost,
    input.flightBonusDiscount ?? "",
    input.flightPassengerCount ?? 1,
  );
  const transport = perPersonServiceAmounts(
    input.includeTransport,
    input.transportSupplierPayment,
    input.transportClientCost,
    input.transportBonusDiscount ?? "",
    input.transportPassengerCount ?? 1,
  );

  const roomPrices = input.roomPrices ?? [];
  const hotelRoomExtras = input.includeHotel
    ? calcHotelRoomExtrasTotal(roomPrices)
    : 0;
  const hotelInFinance = input.includeHotel && hotelRoomExtras > 0;

  const hotel: Pick<
    QuickReservationFinanceLine,
    | "platformCost"
    | "bonusDiscount"
    | "providerCost"
    | "clientCost"
    | "profitGross"
    | "profitNet"
  > = input.includeHotel
    ? {
        platformCost: 0,
        bonusDiscount: 0,
        providerCost: 0,
        clientCost: hotelRoomExtras,
        profitGross: hotelRoomExtras,
        profitNet: hotelRoomExtras,
      }
    : {
        platformCost: 0,
        bonusDiscount: 0,
        providerCost: 0,
        clientCost: 0,
        profitGross: 0,
        profitNet: 0,
      };

  const packagePlatform = parseAmount(input.packagePlatformCost ?? "");
  const packageProvider = parseAmount(input.packageSupplierPayment);
  const packageBonus = parseAmount(input.packageBonusDiscount ?? "");
  const packageProfitGross =
    calcServiceProfit(packageClient, packageProvider) ??
    packageClient - packageProvider;
  const packageProfitNet = packageProfitGross - packageBonus;

  const lines: QuickReservationFinanceLine[] = [
    {
      key: "package",
      label: "Paquete",
      detail:
        packageDetails.length > 0
          ? packageDetails.join(" · ")
          : "Sin pasajeros registrados",
      platformCost: packagePlatform,
      bonusDiscount: packageBonus,
      providerCost: packageProvider,
      clientCost: packageClient,
      profitGross: packageProfitGross,
      profitNet: packageProfitNet,
      included: true,
    },
    {
      key: "flight",
      label: "Vuelo",
      included: input.includeFlight,
      ...flight,
    },
    {
      key: "transport",
      label: "Transporte",
      included: input.includeTransport,
      ...transport,
    },
    {
      key: "hotel",
      label: "Hotel",
      detail: hotelInFinance
        ? buildHotelRoomExtrasDetail(roomPrices)
        : undefined,
      included: hotelInFinance,
      ...hotel,
    },
  ];

  const activeServices = lines.filter(
    (line) => line.key !== "package" && line.included,
  );

  const servicesSubtotal = activeServices.reduce(
    (acc, line) => ({
      platformCost: acc.platformCost + line.platformCost,
      bonusDiscount: acc.bonusDiscount + line.bonusDiscount,
      providerCost: acc.providerCost + line.providerCost,
      clientCost: acc.clientCost + line.clientCost,
      profitGross: acc.profitGross + line.profitGross,
      profitNet: acc.profitNet + line.profitNet,
    }),
    {
      platformCost: 0,
      bonusDiscount: 0,
      providerCost: 0,
      clientCost: 0,
      profitGross: 0,
      profitNet: 0,
    },
  );

  const packageLine = lines[0];
  const totals = {
    platformCost: packageLine.platformCost + servicesSubtotal.platformCost,
    bonusDiscount: packageLine.bonusDiscount + servicesSubtotal.bonusDiscount,
    providerCost: packageLine.providerCost + servicesSubtotal.providerCost,
    clientCost: packageLine.clientCost + servicesSubtotal.clientCost,
    profitGross: packageLine.profitGross + servicesSubtotal.profitGross,
    profitNet: packageLine.profitNet + servicesSubtotal.profitNet,
  };

  return {
    lines,
    servicesSubtotal: {
      ...servicesSubtotal,
      hasServices: activeServices.length > 0,
    },
    totals,
  };
}
