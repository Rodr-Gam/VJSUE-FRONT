import { api } from "./api";
import {
  financeArchiveService,
  isProfitRowArchived,
} from "./financeArchiveService";
import type { ProfitRow, ProfitSummary, ServiceProfitType } from "./types/serviceProfit";
import { profitFromRecord, profitNetFromRecord } from "./utils/serviceProfit";

const TYPE_LABELS: Record<ServiceProfitType, string> = {
  flight: "Vuelo",
  transport: "Transporte",
  package: "Paquete",
  tour: "Tour",
};

function pushRow(
  rows: ProfitRow[],
  type: ServiceProfitType,
  item: {
    id: number;
    reservation_id?: number;
    reservation?: { id?: number; user?: { name?: string } };
    provider_cost?: string | number | null;
    client_cost?: string | number | null;
    profit?: number | string | null;
    profit_net?: number | string | null;
    bonus_discount?: string | number | null;
    service_type?: string;
    airline_name?: string;
    destination?: string;
    name?: string;
    company?: string;
  },
  description: string,
) {
  const providerCost = Number(item.provider_cost ?? 0);
  const clientCost = Number(item.client_cost ?? 0);
  const profit = profitFromRecord(item.profit, item.client_cost, item.provider_cost);

  if (profit === null) return;

  const bonusDiscount = Number(item.bonus_discount ?? 0);
  const profitNet = profitNetFromRecord(
    profit,
    item.profit_net,
    item.bonus_discount,
  );

  rows.push({
    id: item.id,
    type,
    typeLabel: TYPE_LABELS[type],
    description,
    clientName: item.reservation?.user?.name ?? "—",
    reservationId: item.reservation_id ?? item.reservation?.id ?? 0,
    providerCost,
    clientCost,
    profit,
    profitNet,
    bonusDiscount: Number.isFinite(bonusDiscount) ? bonusDiscount : 0,
  });
}

export function summarizeProfitRows(rows: ProfitRow[]): ProfitSummary {
  return rows.reduce(
    (acc, row) => {
      if (row.type === "flight") acc.flights += row.profit;
      else if (row.type === "transport") acc.transports += row.profit;
      else if (row.type === "package") acc.packages += row.profit;
      else if (row.type === "tour") acc.tours += row.profit;
      acc.total += row.profit;
      acc.totalNet += row.profitNet;
      acc.count += 1;
      return acc;
    },
    {
      flights: 0,
      transports: 0,
      packages: 0,
      tours: 0,
      total: 0,
      totalNet: 0,
      count: 0,
    },
  );
}

export async function fetchProfitRows(): Promise<ProfitRow[]> {
  const [archivedMap, flightsRes, transportsRes, packagesRes] = await Promise.all([
    financeArchiveService.getArchivedIds([
      "flight",
      "transport",
      "reservation_profit",
    ]),
    api.get("/flights"),
    api.get("/transports"),
    api.get("/reservations/package-profits"),
  ]);

  const rows: ProfitRow[] = [];

  for (const flight of flightsRes.data ?? []) {
    pushRow(
      rows,
      "flight",
      flight,
      `${flight.airline_name ?? "Vuelo"} · ${flight.destination ?? ""}`.trim(),
    );
  }

  for (const transport of transportsRes.data ?? []) {
    pushRow(
      rows,
      "transport",
      transport,
      `${transport.company ?? "Transporte"} · ${transport.destination ?? ""}`.trim(),
    );
  }

  for (const pkg of packagesRes.data ?? []) {
    const rowType: ServiceProfitType =
      pkg.service_type === "tour" || pkg.booking_channel === "tour"
        ? "tour"
        : "package";
    pushRow(rows, rowType, pkg, pkg.description ?? (rowType === "tour" ? "Tour" : "Paquete"));
  }

  return rows
    .filter((row) => !isProfitRowArchived(row, archivedMap))
    .sort((a, b) => b.profit - a.profit);
}
