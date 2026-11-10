import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import Pagination from "../../../components/common/Pagination";
import {
  financeArchiveService,
  getFinanceArchiveErrorMessage,
} from "../../../financeArchiveService";
import type {
  FinanceArchiveModuleFilter,
  FinanceArchiveRow,
} from "../../../types/financeArchive";
import { formatAdminDate } from "../../../utils/adminFormat";
import { Archive, RotateCcw, SearchIcon } from "lucide-react";
import "../../../styles/AdminFinance.css";
import "../../../styles/AdminArchived.css";

const MODULE_OPTIONS: { value: FinanceArchiveModuleFilter; label: string }[] = [
  { value: "", label: "Todos los módulos" },
  { value: "accounts", label: "Cuentas por cobrar" },
  { value: "supplier", label: "Pagos a proveedor" },
  { value: "receipts", label: "Abonos de clientes" },
  { value: "profits", label: "Ganancias" },
];

function archiverName(row: FinanceArchiveRow): string {
  if (!row.archiver) return "—";
  return [row.archiver.name, row.archiver.last_name].filter(Boolean).join(" ");
}

function detailLink(row: FinanceArchiveRow): string | null {
  if (row.subject_type === "account") return `/admin/cuentas/${row.subject_id}`;
  if (row.subject_type === "supplier_account") {
    return `/admin/pagos-proveedor/${row.subject_id}`;
  }
  const reservationId = row.meta?.reservation_id;
  if (typeof reservationId === "number") {
    return `/admin/reservas/detalle/${reservationId}`;
  }
  return null;
}

export default function VerFinanzasArchivadas() {
  const [items, setItems] = useState<FinanceArchiveRow[]>([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<FinanceArchiveModuleFilter>("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await financeArchiveService.list({
        module: moduleFilter || undefined,
        search: search.trim() || undefined,
        page,
        per_page: 20,
      });
      setItems(res.data);
      setLastPage(res.last_page);
      setTotal(res.total);
    } catch (err) {
      setError(getFinanceArchiveErrorMessage(err, "No se pudieron cargar los archivados."));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [moduleFilter, search, page]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [moduleFilter, search]);

  const handleRestore = async (row: FinanceArchiveRow) => {
    if (!window.confirm(`¿Restaurar "${row.title}" al listado activo?`)) return;
    setRestoringId(row.id);
    try {
      await financeArchiveService.restore(row.id);
      setToast("Registro restaurado.");
      await load();
    } catch (err) {
      window.alert(getFinanceArchiveErrorMessage(err));
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="adm-list-page">
        <div className="R-card-tt mb-4">
          <h2 className="R-dashboard-title text-[#d3a762] flex items-center gap-2">
            <Archive size={22} />
            Finanzas archivadas
          </h2>
          <p className="adm-cell-muted text-sm mt-1">
            Registros ocultos del módulo de finanzas. Restáuralos cuando quieras volver a
            gestionarlos en su pantalla original.
          </p>
        </div>

        {toast && (
          <div className="adm-list-alert" role="status">
            {toast}
            <button type="button" onClick={() => setToast(null)}>
              Cerrar
            </button>
          </div>
        )}

        <div className="adm-list-toolbar">
          <div className="adm-list-toolbar-grid adm-toolbar-3">
            <label className="adm-list-search">
              <SearchIcon size={18} className="text-[#d3a762] shrink-0" />
              <input
                type="text"
                placeholder="Buscar por cliente, título o paquete..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              className="adm-list-select"
              value={moduleFilter}
              onChange={(e) =>
                setModuleFilter(e.target.value as FinanceArchiveModuleFilter)
              }
            >
              {MODULE_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="adm-list-card">
          <div className="adm-list-head">
            <h2 className="adm-list-title">Listado</h2>
            <span className="adm-list-count">{total} archivados</span>
          </div>

          {error && <p className="adm-empty text-red-600">{error}</p>}
          {loading && <p className="adm-empty">Cargando...</p>}

          {!loading && !error && items.length === 0 && (
            <p className="adm-empty">No hay registros archivados con estos filtros.</p>
          )}

          {!loading && items.length > 0 && (
            <>
              <div className="hidden md:block adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Módulo</th>
                      <th>Registro</th>
                      <th>Detalle</th>
                      <th>Archivado</th>
                      <th>Por</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => {
                      const href = detailLink(row);
                      return (
                        <tr key={row.id}>
                          <td>
                            <span className="adm-badge adm-badge--info">{row.module_label}</span>
                          </td>
                          <td className="adm-cell-strong">{row.title}</td>
                          <td className="adm-cell-muted">{row.subtitle ?? "—"}</td>
                          <td>{formatAdminDate(row.archived_at?.split("T")[0])}</td>
                          <td>{archiverName(row)}</td>
                          <td>
                            <div className="id-row-actions">
                              {href && (
                                <Link to={href} className="id-btn id-btn--ghost">
                                  Ver
                                </Link>
                              )}
                              <button
                                type="button"
                                className="id-btn id-btn--ghost"
                                disabled={restoringId === row.id}
                                onClick={() => handleRestore(row)}
                              >
                                <RotateCcw size={14} />
                                Restaurar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="md:hidden space-y-3">
                {items.map((row) => (
                  <li key={row.id} className="adm-mobile-card">
                    <p className="adm-badge adm-badge--info inline-block mb-1">
                      {row.module_label}
                    </p>
                    <strong>{row.title}</strong>
                    <p className="adm-cell-muted text-sm">{row.subtitle ?? "—"}</p>
                    <p className="text-xs text-slate-500">
                      {formatAdminDate(row.archived_at?.split("T")[0])} · {archiverName(row)}
                    </p>
                    <button
                      type="button"
                      className="id-btn id-btn--ghost mt-2"
                      disabled={restoringId === row.id}
                      onClick={() => handleRestore(row)}
                    >
                      Restaurar
                    </button>
                  </li>
                ))}
              </ul>

              {lastPage > 1 && (
                <Pagination currentPage={page} totalPages={lastPage} onPageChange={setPage} />
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
