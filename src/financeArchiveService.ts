import { api } from "./api";
import type {
  FinanceArchiveListParams,
  FinanceArchiveSubjectType,
  FinanceArchivedIdsMap,
  PaginatedFinanceArchives,
} from "./types/financeArchive";

export function getFinanceArchiveErrorMessage(
  error: unknown,
  fallback = "No se pudo completar la operación.",
): string {
  if (error && typeof error === "object") {
    const err = error as { response?: { data?: { message?: string } } };
    if (err.response?.data?.message) return err.response.data.message;
  }
  return fallback;
}

function unwrapPage(data: unknown): PaginatedFinanceArchives {
  if (data && typeof data === "object" && "data" in data) {
    const p = data as PaginatedFinanceArchives;
    return {
      data: Array.isArray(p.data) ? p.data : [],
      current_page: p.current_page ?? 1,
      last_page: p.last_page ?? 1,
      total: p.total ?? 0,
    };
  }
  return { data: [], current_page: 1, last_page: 1, total: 0 };
}

export const financeArchiveService = {
  async list(params: FinanceArchiveListParams = {}): Promise<PaginatedFinanceArchives> {
    const { data } = await api.get("/finance-archives", { params });
    return unwrapPage(data);
  },

  async getArchivedIds(types?: FinanceArchiveSubjectType[]): Promise<FinanceArchivedIdsMap> {
    const { data } = await api.get<FinanceArchivedIdsMap>("/finance-archives/ids", {
      params: types?.length ? { types: types.join(",") } : undefined,
    });
    return data && typeof data === "object" ? data : {};
  },

  async archive(subjectType: FinanceArchiveSubjectType, subjectId: number): Promise<void> {
    await api.post("/finance-archives", {
      subject_type: subjectType,
      subject_id: subjectId,
    });
  },

  async restore(archiveId: number): Promise<void> {
    await api.delete(`/finance-archives/${archiveId}`);
  },
};

export function profitRowArchiveSubject(row: {
  type: string;
  id: number;
  reservationId: number;
}): { subjectType: FinanceArchiveSubjectType; subjectId: number } {
  if (row.type === "flight") {
    return { subjectType: "flight", subjectId: row.id };
  }
  if (row.type === "transport") {
    return { subjectType: "transport", subjectId: row.id };
  }
  return { subjectType: "reservation_profit", subjectId: row.reservationId };
}

export function isProfitRowArchived(
  row: { type: string; id: number; reservationId: number },
  map: FinanceArchivedIdsMap,
): boolean {
  const { subjectType, subjectId } = profitRowArchiveSubject(row);
  const ids = map[subjectType] ?? [];
  return ids.includes(subjectId);
}
