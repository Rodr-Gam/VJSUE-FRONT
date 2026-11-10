export type FinanceArchiveSubjectType =
  | "account"
  | "supplier_account"
  | "payment_receipt"
  | "flight"
  | "transport"
  | "reservation_profit";

export type FinanceArchiveModuleFilter =
  | ""
  | "accounts"
  | "supplier"
  | "receipts"
  | "profits";

export type FinanceListVisibility = "active" | "archived" | "all";

export interface FinanceArchiveRow {
  id: number;
  subject_type: FinanceArchiveSubjectType;
  subject_id: number;
  module: FinanceArchiveModuleFilter extends "" ? string : FinanceArchiveModuleFilter;
  module_label: string;
  title: string;
  subtitle: string | null;
  meta: Record<string, unknown>;
  archived_at: string | null;
  archiver: {
    id: number;
    name: string;
    last_name?: string | null;
  } | null;
}

export interface FinanceArchiveListParams {
  module?: FinanceArchiveModuleFilter;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedFinanceArchives {
  data: FinanceArchiveRow[];
  current_page: number;
  last_page: number;
  total: number;
}

export type FinanceArchivedIdsMap = Partial<
  Record<FinanceArchiveSubjectType, number[]>
>;
