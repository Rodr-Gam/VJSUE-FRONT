export type ServiceProfitType = "flight" | "transport" | "package" | "tour";

export interface ProfitRow {
  id: number;
  type: ServiceProfitType;
  typeLabel: string;
  description: string;
  clientName: string;
  reservationId: number;
  providerCost: number;
  clientCost: number;
  profit: number;
  profitNet: number;
  bonusDiscount: number;
}

export interface ProfitSummary {
  flights: number;
  transports: number;
  packages: number;
  tours: number;
  total: number;
  totalNet: number;
  count: number;
}
