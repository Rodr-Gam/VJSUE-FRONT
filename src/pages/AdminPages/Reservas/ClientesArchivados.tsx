import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../../api";
import { Link } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import LoadingScreen from "../../../components/Admin/LoadingScreen";
import Pagination from "../../../components/common/Pagination";
import {
  SearchIcon,
  Archive,
  ArrowBigLeftIcon,
  FolderOpenIcon,
  CalendarRange,
} from "lucide-react";
import "../../../styles/AdminFinance.css";
import "../../../styles/AdminArchived.css";

interface ClienteArchivado {
  id: number;
  name: string;
  last_name?: string;
  email: string;
  archived_count: number;
  total_count: number;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

const SEARCH_DEBOUNCE_MS = 400;
const MAX_SEARCH_LENGTH = 100;
const PER_PAGE = 20;

function isPaginatedClientResponse(
  data: unknown,
): data is PaginatedResponse<ClienteArchivado> {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as PaginatedResponse<ClienteArchivado>).data) &&
    typeof (data as PaginatedResponse<ClienteArchivado>).current_page ===
      "number"
  );
}

function clientFullName(cliente: ClienteArchivado) {
  return [cliente.name, cliente.last_name].filter(Boolean).join(" ");
}

function archivePercent(cliente: ClienteArchivado): number {
  if (!cliente.total_count) return 0;
  return Math.round((cliente.archived_count / cliente.total_count) * 100);
}

export default function ClientesArchivados() {
  const [clientes, setClientes] = useState<ClienteArchivado[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [archivedFrom, setArchivedFrom] = useState("");
  const [archivedTo, setArchivedTo] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, archivedFrom, archivedTo]);

  const cargarClientes = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await api.get("/clientes/archivados", {
          signal,
          params: {
            page,
            per_page: PER_PAGE,
            search: debouncedSearch || undefined,
            archived_from: archivedFrom || undefined,
            archived_to: archivedTo || undefined,
          },
        });

        if (!isPaginatedClientResponse(res.data)) {
          throw new Error("Formato de respuesta inesperado");
        }

        if (isMountedRef.current) {
          setClientes(res.data.data);
          setLastPage(res.data.last_page);
          setTotal(res.data.total);
        }
      } catch (err) {
        if (signal?.aborted) return;
        console.error("Error al cargar expedientes archivados:", err);
        if (isMountedRef.current) {
          setError(
            "No se pudieron cargar los expedientes. Intenta nuevamente.",
          );
          setClientes([]);
          setLastPage(1);
          setTotal(0);
        }
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    [page, debouncedSearch, archivedFrom, archivedTo],
  );

  useEffect(() => {
    isMountedRef.current = true;
    const controller = new AbortController();
    cargarClientes(controller.signal);

    return () => {
      isMountedRef.current = false;
      controller.abort();
    };
  }, [cargarClientes]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value.slice(0, MAX_SEARCH_LENGTH));
  };

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setArchivedFrom("");
    setArchivedTo("");
  };

  const hasActiveFilters = Boolean(search || archivedFrom || archivedTo);

  if (isLoading && clientes.length === 0 && !error) {
    return (
      <AdminLayout>
        <LoadingScreen icon={Archive} text="Cargando expedientes archivados..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="adm-list-page adm-archived-page">
        <Link to="/admin/clientes" className="adm-account-back">
          <ArrowBigLeftIcon size={18} aria-hidden="true" />
          Volver a clientes
        </Link>

        <header className="adm-accounts-hero adm-accounts-hero--archived">
          <div className="adm-accounts-hero-icon" aria-hidden="true">
            <Archive size={22} />
          </div>
          <div>
            <h1 className="adm-accounts-hero-title">Expedientes archivados</h1>
            <p className="adm-accounts-hero-sub">
              Clientes con al menos una reserva archivada. Abre el expediente para
              ver el historial completo.
            </p>
          </div>
        </header>

        <div className="adm-list-toolbar">
          <div className="adm-list-toolbar-grid adm-toolbar-archived">
            <label className="adm-list-search">
              <SearchIcon size={18} className="text-[#d3a762] shrink-0" />
              <input
                id="cliente-search"
                type="text"
                value={search}
                onChange={handleSearchChange}
                maxLength={MAX_SEARCH_LENGTH}
                placeholder="Buscar por nombre, apellido o email..."
                autoComplete="off"
              />
            </label>
            <label className="adm-list-date-field">
              <CalendarRange size={16} className="text-[#d3a762] shrink-0" />
              <span className="adm-list-date-label">Desde</span>
              <input
                id="archived-from"
                type="date"
                value={archivedFrom}
                onChange={(e) => setArchivedFrom(e.target.value)}
              />
            </label>
            <label className="adm-list-date-field">
              <CalendarRange size={16} className="text-[#d3a762] shrink-0" />
              <span className="adm-list-date-label">Hasta</span>
              <input
                id="archived-to"
                type="date"
                value={archivedTo}
                onChange={(e) => setArchivedTo(e.target.value)}
              />
            </label>
            {hasActiveFilters ? (
              <button
                type="button"
                className="adm-list-cta adm-list-cta--ghost"
                onClick={handleClearFilters}
              >
                Limpiar filtros
              </button>
            ) : (
              <span className="adm-archived-toolbar-spacer" aria-hidden="true" />
            )}
          </div>
        </div>

        <div className="adm-list-card adm-archived-card">
          <div className="adm-list-head">
            <h2 className="adm-list-title flex items-center gap-2">
              <Archive size={22} className="text-[#d3a762]" />
              Clientes con archivos
            </h2>
            <span className="adm-list-count" aria-live="polite">
              {total} {total === 1 ? "cliente" : "clientes"}
            </span>
          </div>

          {error && (
            <div className="adm-list-alert" role="alert">
              {error}{" "}
              <button type="button" onClick={() => cargarClientes()}>
                Reintentar
              </button>
            </div>
          )}

          {isLoading && clientes.length > 0 && (
            <p className="adm-archived-loading-hint">Actualizando listado…</p>
          )}

          {!isLoading && clientes.length === 0 && (
            <div className="adm-archived-empty">
              <Archive size={40} className="adm-archived-empty-icon" aria-hidden />
              <p className="adm-archived-empty-title">
                {hasActiveFilters
                  ? "No se encontraron resultados"
                  : "No hay expedientes archivados"}
              </p>
              <p className="adm-archived-empty-sub">
                {hasActiveFilters
                  ? "Prueba otros filtros o límpialos para ver todos los expedientes."
                  : "Cuando archives reservas, los clientes aparecerán aquí."}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="adm-list-cta adm-list-cta--ghost"
                  onClick={handleClearFilters}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          {clientes.length > 0 && (
            <>
              <div className="hidden md:block adm-table-wrap">
                <table className="adm-table adm-table--lg adm-table--archived">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Email</th>
                      <th>Archivadas</th>
                      <th>Total reservas</th>
                      <th>Proporción</th>
                      <th aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((cliente) => {
                      const pct = archivePercent(cliente);
                      return (
                        <tr key={cliente.id}>
                          <td>
                            <div className="adm-cell-strong">
                              {clientFullName(cliente)}
                            </div>
                            <div className="adm-cell-muted">ID #{cliente.id}</div>
                          </td>
                          <td>{cliente.email || "—"}</td>
                          <td>
                            <span className="adm-badge adm-badge--archived">
                              {cliente.archived_count}
                            </span>
                          </td>
                          <td className="adm-stock">{cliente.total_count}</td>
                          <td className="adm-archived-ratio-cell">
                            <div className="adm-archived-ratio">
                              <div
                                className="adm-archived-ratio-bar"
                                role="presentation"
                              >
                                <div
                                  className="adm-archived-ratio-fill"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="adm-archived-ratio-label">
                                {pct}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <Link
                              to={`/admin/reservas/expediente/${cliente.id}`}
                              className="adm-archived-expediente-link"
                              title="Ver expediente"
                            >
                              <FolderOpenIcon size={18} />
                              Expediente
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {clientes.map((cliente) => {
                  const pct = archivePercent(cliente);
                  return (
                    <Link
                      key={cliente.id}
                      to={`/admin/reservas/expediente/${cliente.id}`}
                      className="adm-archived-mobile-card"
                    >
                      <div className="adm-archived-mobile-head">
                        <div>
                          <h3 className="adm-mobile-card-title">
                            {clientFullName(cliente)}
                          </h3>
                          <p className="adm-mobile-card-sub">
                            {cliente.email || "Sin email"}
                          </p>
                        </div>
                        <span className="adm-badge adm-badge--archived">
                          {cliente.archived_count} arch.
                        </span>
                      </div>
                      <div className="adm-archived-ratio adm-archived-ratio--mobile">
                        <div className="adm-archived-ratio-bar">
                          <div
                            className="adm-archived-ratio-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="adm-archived-ratio-meta">
                          {cliente.archived_count} de {cliente.total_count} · {pct}%
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <Pagination
                currentPage={page}
                totalPages={lastPage}
                onPageChange={setPage}
                className="justify-center md:justify-end"
              />
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
