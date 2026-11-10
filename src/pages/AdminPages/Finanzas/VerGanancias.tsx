import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import { fetchProfitRows, summarizeProfitRows } from "../../../profitService";
import type { ProfitRow, ServiceProfitType } from "../../../types/serviceProfit";
import { formatAdminMoney } from "../../../utils/adminFormat";
import Pagination from "../../../components/common/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { SearchIcon, TrendingUpIcon } from "lucide-react";
import FinanceArchiveButton from "../../../components/Admin/finance/FinanceArchiveButton";
import { profitRowArchiveSubject } from "../../../financeArchiveService";
import "../../../styles/AdminFinance.css";

const TYPE_OPTIONS: { value: ServiceProfitType | ""; label: string }[] = [
  { value: "", label: "Todos los servicios" },
  { value: "flight", label: "Vuelos" },
  { value: "transport", label: "Transporte" },
  { value: "package", label: "Paquetes" },
  { value: "tour", label: "Tours" },
];

function profitNetClass(value: number): string {
  return value < 0 ? "font-semibold text-red-600" : "font-semibold text-emerald-700";
}

export default function VerGanancias() {
  const [rows, setRows] = useState<ProfitRow[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ServiceProfitType | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProfitRows();
      setRows(data);
    } catch {
      setError("No se pudieron cargar las ganancias.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesType = typeFilter ? row.type === typeFilter : true;
      const matchesSearch =
        !term ||
        row.clientName.toLowerCase().includes(term) ||
        row.description.toLowerCase().includes(term) ||
        row.typeLabel.toLowerCase().includes(term) ||
        String(row.reservationId).includes(term);

      return matchesType && matchesSearch;
    });
  }, [rows, search, typeFilter]);

  const summary = useMemo(
    () => summarizeProfitRows(filteredRows),
    [filteredRows],
  );

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginated: pageRows,
  } = usePagination(filteredRows, 12);

  return (
    <AdminLayout>
      <div className="adm-list-page">
        <div className="R-card-tt mb-4">
          <h2 className="R-dashboard-title text-[#d3a762] flex items-center gap-2">
            <TrendingUpIcon size={24} />
            Ganancias por servicio
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Servicios con pago a proveedor y cobro al cliente registrados.
            Ganancia = cobro − proveedor; ganancia real descontando bono o descuento.
            Los tours se listan aparte de reservas privadas (paquetes).
          </p>
        </div>

        <div className="adm-finance-summary adm-finance-summary--profits mb-6">
          <div className="adm-finance-stat">
            <p className="adm-finance-stat-label">Vuelos</p>
            <p className="adm-finance-stat-value adm-finance-stat-value--paid">
              ${formatAdminMoney(summary.flights)}
            </p>
          </div>
          <div className="adm-finance-stat">
            <p className="adm-finance-stat-label">Transporte</p>
            <p className="adm-finance-stat-value adm-finance-stat-value--paid">
              ${formatAdminMoney(summary.transports)}
            </p>
          </div>
          <div className="adm-finance-stat">
            <p className="adm-finance-stat-label">Paquetes</p>
            <p className="adm-finance-stat-value adm-finance-stat-value--paid">
              ${formatAdminMoney(summary.packages)}
            </p>
          </div>
          <div className="adm-finance-stat">
            <p className="adm-finance-stat-label">Tours</p>
            <p className="adm-finance-stat-value adm-finance-stat-value--paid">
              ${formatAdminMoney(summary.tours)}
            </p>
          </div>
          <div className="adm-finance-stat">
            <p className="adm-finance-stat-label">Total ganancia</p>
            <p className="adm-finance-stat-value adm-finance-stat-value--paid">
              ${formatAdminMoney(summary.total)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{summary.count} registros</p>
          </div>
          <div className="adm-finance-stat">
            <p className="adm-finance-stat-label">Total ganancia real</p>
            <p className="adm-finance-stat-value adm-finance-stat-value--paid">
              ${formatAdminMoney(summary.totalNet)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Después de bonos</p>
          </div>
        </div>

        <div className="adm-list-toolbar">
          <div className="adm-list-toolbar-grid adm-toolbar-3">
            <label className="adm-list-search">
              <SearchIcon size={18} className="text-[#d3a762] shrink-0" />
              <input
                type="text"
                placeholder="Buscar cliente, servicio o reserva..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>
            <select
              className="adm-list-select"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as ServiceProfitType | "");
                setCurrentPage(1);
              }}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="adm-list-card">
          {loading && <p className="adm-empty">Cargando ganancias...</p>}
          {error && <p className="adm-empty text-red-600">{error}</p>}

          {!loading && !error && filteredRows.length === 0 && (
            <p className="adm-empty">
              No hay ganancias registradas. Agrega el costo de agencia en vuelos, transporte o el precio proveedor en paquetes.
            </p>
          )}

          {!loading && !error && filteredRows.length > 0 && (
            <>
              <div className="hidden md:block adm-table-wrap">
                <table className="adm-table adm-table--xl">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Servicio</th>
                      <th>Cliente</th>
                      <th>Reserva</th>
                      <th>Pago proveedor</th>
                      <th>Cobro cliente</th>
                      <th>Ganancia</th>
                      <th>Ganancia real</th>
                      <th aria-label="Archivar" />
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => (
                      <tr key={`${row.type}-${row.id}`}>
                        <td>{row.typeLabel}</td>
                        <td className="adm-cell-strong">{row.description}</td>
                        <td>{row.clientName}</td>
                        <td>
                          <Link
                            to={`/admin/reservas/detalle/${row.reservationId}`}
                            className="text-[#d3a762] hover:underline"
                          >
                            #{row.reservationId}
                          </Link>
                        </td>
                        <td>${formatAdminMoney(row.providerCost)}</td>
                        <td>${formatAdminMoney(row.clientCost)}</td>
                        <td className="font-semibold text-emerald-700">
                          ${formatAdminMoney(row.profit)}
                        </td>
                        <td className={profitNetClass(row.profitNet)}>
                          ${formatAdminMoney(row.profitNet)}
                        </td>
                        <td>
                          {(() => {
                            const subj = profitRowArchiveSubject(row);
                            return (
                              <FinanceArchiveButton
                                subjectType={subj.subjectType}
                                subjectId={subj.subjectId}
                                onArchived={loadRows}
                              />
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {pageRows.map((row) => (
                  <article key={`${row.type}-${row.id}`} className="adm-mobile-card">
                    <div className="adm-mobile-card-head">
                      <div>
                        <h3 className="adm-mobile-card-title">{row.description}</h3>
                        <p className="adm-mobile-card-sub">{row.typeLabel}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const subj = profitRowArchiveSubject(row);
                          return (
                            <FinanceArchiveButton
                              subjectType={subj.subjectType}
                              subjectId={subj.subjectId}
                              onArchived={loadRows}
                            />
                          );
                        })()}
                        <span className={profitNetClass(row.profitNet)}>
                          ${formatAdminMoney(row.profitNet)}
                        </span>
                      </div>
                    </div>
                    <div className="adm-mobile-grid">
                      <p>
                        <span>Cliente</span>
                        {row.clientName}
                      </p>
                      <p>
                        <span>Reserva</span>#{row.reservationId}
                      </p>
                      <p>
                        <span>Proveedor</span>${formatAdminMoney(row.providerCost)}
                      </p>
                      <p>
                        <span>Cobro</span>${formatAdminMoney(row.clientCost)}
                      </p>
                      <p>
                        <span>Ganancia</span>${formatAdminMoney(row.profit)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="justify-center md:justify-end"
              />
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
