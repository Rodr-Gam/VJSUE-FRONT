import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import { getClients, toggleClientFrequent } from "../../../clientService";
import type { Client, ClientState } from "../../../types/client";
import Pagination from "../../../components/common/Pagination";
import {
  ArchiveIcon,
  FolderOpenIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Star,
  UsersIcon,
} from "lucide-react";

const STATE_LABELS: Record<ClientState, string> = {
  active: "Activo",
  inactive: "Inactivo",
  banned: "Bloqueado",
};

const STATE_BADGE: Record<ClientState, string> = {
  active: "adm-badge adm-badge--active",
  inactive: "adm-badge adm-badge--inactive",
  banned: "adm-badge adm-badge--cancelled",
};

function ClientStateBadge({ state }: { state: ClientState }) {
  const normalized = (state in STATE_LABELS ? state : "active") as ClientState;
  return (
    <span className={STATE_BADGE[normalized] ?? "adm-badge adm-badge--info"}>
      {STATE_LABELS[normalized] ?? state}
    </span>
  );
}

function clientFullName(client: Client) {
  return [client.name, client.last_name].filter(Boolean).join(" ");
}

export default function VerClientes() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<ClientState | "">("");
  const [frequentFilter, setFrequentFilter] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, stateFilter, frequentFilter]);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getClients({
        search: debouncedSearch || undefined,
        state: stateFilter,
        frequent: frequentFilter || undefined,
        page: currentPage,
        per_page: 20,
      });

      setClients(result.data);
      setTotalPages(Math.max(1, result.meta.last_page));
      setTotalCount(result.meta.total);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
      setError("No se pudieron cargar los clientes.");
      setClients([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, stateFilter, frequentFilter, currentPage]);

  const handleToggleFrequent = async (client: Client) => {
    if (togglingId !== null) return;
    setTogglingId(client.id);
    try {
      const { user } = await toggleClientFrequent(client.id);
      setClients((prev) =>
        prev.map((c) =>
          c.id === user.id
            ? {
                ...c,
                is_frequent_client: user.is_frequent_client,
                reservations_count:
                  user.reservations_count ?? c.reservations_count,
              }
            : c,
        ),
      );
      if (frequentFilter && !user.is_frequent_client) {
        await loadClients();
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar la estrella del cliente.");
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  return (
    <AdminLayout>
      <div className="adm-list-page">
        <div className="adm-list-toolbar">
          <div className="adm-list-toolbar-grid adm-toolbar-4">
            <label className="adm-list-search">
              <SearchIcon size={18} className="text-[#d3a762] shrink-0" />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              className="adm-list-select"
              value={stateFilter}
              onChange={(e) =>
                setStateFilter(e.target.value as ClientState | "")
              }
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="banned">Bloqueado</option>
            </select>
            <select
              className="adm-list-select"
              value={frequentFilter ? "frequent" : ""}
              onChange={(e) => setFrequentFilter(e.target.value === "frequent")}
            >
              <option value="">Todos los clientes</option>
              <option value="frequent">Clientes frecuentes</option>
            </select>
            <Link to="/admin/crear-cliente" className="adm-list-cta">
              <PlusIcon size={18} />
              Nuevo cliente
            </Link>
          </div>
        </div>

        <div className="adm-list-card">
          <div className="adm-list-head">
            <h2 className="adm-list-title flex items-center gap-2">
              <UsersIcon size={22} className="text-[#d3a762]" />
              Clientes registrados
            </h2>
            <span className="adm-list-count">{totalCount} clientes</span>
          </div>

          {error && (
            <div className="adm-list-alert" role="alert">
              {error}{" "}
              <button type="button" onClick={loadClients}>
                Reintentar
              </button>
            </div>
          )}

          {loading && (
            <p className="adm-empty">Cargando clientes...</p>
          )}

          {!loading && clients.length === 0 && (
            <p className="adm-empty">
              {search || stateFilter || frequentFilter
                ? "No se encontraron clientes con esos filtros."
                : "Aún no hay clientes registrados."}
            </p>
          )}

          {!loading && clients.length > 0 && (
            <>
              <div className="hidden md:block adm-table-wrap">
                <table className="adm-table adm-table--lg">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>Reservas</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id}>
                        <td>
                          <div className="adm-client-name-row">
                            <button
                              type="button"
                              className={`adm-client-star${client.is_frequent_client ? " adm-client-star--on" : ""}`}
                              title={
                                client.is_frequent_client
                                  ? "Quitar de clientes frecuentes"
                                  : "Marcar como cliente frecuente"
                              }
                              disabled={togglingId === client.id}
                              onClick={() => handleToggleFrequent(client)}
                            >
                              <Star
                                size={18}
                                fill={
                                  client.is_frequent_client
                                    ? "currentColor"
                                    : "none"
                                }
                                aria-hidden="true"
                              />
                            </button>
                            <div>
                              <div className="adm-cell-strong">
                                {clientFullName(client)}
                              </div>
                              <div className="adm-cell-muted">ID #{client.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>{client.email}</td>
                        <td>{client.phone?.trim() || "—"}</td>
                        <td className="adm-stock">
                          {client.reservations_count ?? "—"}
                        </td>
                        <td>
                          <ClientStateBadge state={client.state} />
                        </td>
                        <td>
                          <div className="adm-actions">
                            <Link
                              to={`/admin/cliente/${client.id}`}
                              title="Editar cliente"
                              className="R-btn-action R-btn-edit"
                            >
                              <PencilIcon
                                size={18}
                                className="text-[#d3a762]"
                              />
                            </Link>
                            <Link
                              to={`/admin/reservas/expediente/${client.id}`}
                              title="Ver expediente"
                              className="R-btn-action R-btn-edit"
                            >
                              <FolderOpenIcon
                                size={18}
                                className="text-[#d3a762]"
                              />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {clients.map((client) => (
                  <article key={client.id} className="adm-mobile-card">
                    <div className="adm-mobile-card-head">
                      <div>
                        <div className="adm-client-name-row">
                          <button
                            type="button"
                            className={`adm-client-star${client.is_frequent_client ? " adm-client-star--on" : ""}`}
                            title={
                              client.is_frequent_client
                                ? "Quitar de clientes frecuentes"
                                : "Marcar como cliente frecuente"
                            }
                            disabled={togglingId === client.id}
                            onClick={() => handleToggleFrequent(client)}
                          >
                            <Star
                              size={18}
                              fill={
                                client.is_frequent_client
                                  ? "currentColor"
                                  : "none"
                              }
                              aria-hidden="true"
                            />
                          </button>
                          <h3 className="adm-mobile-card-title">
                            {clientFullName(client)}
                          </h3>
                        </div>
                        <p className="adm-mobile-card-sub">{client.email}</p>
                      </div>
                      <div className="adm-actions">
                        <Link
                          to={`/admin/cliente/${client.id}`}
                          className="R-btn-action R-btn-edit"
                          title="Editar cliente"
                        >
                          <PencilIcon size={18} className="text-[#d3a762]" />
                        </Link>
                        <Link
                          to={`/admin/reservas/expediente/${client.id}`}
                          className="R-btn-action R-btn-edit"
                          title="Ver expediente"
                        >
                          <FolderOpenIcon size={18} className="text-[#d3a762]" />
                        </Link>
                      </div>
                    </div>
                    <div className="adm-mobile-grid">
                      <p>
                        <span>Teléfono</span>
                        {client.phone?.trim() || "—"}
                      </p>
                      <p>
                        <span>Reservas</span>
                        {client.reservations_count ?? "—"}
                      </p>
                      <p>
                        <span>Estado</span>
                        <ClientStateBadge state={client.state} />
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

        <div className="mt-3 text-center md:text-right">
          <Link
            to="/admin/reservas/archivados"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#d3a762] transition-colors"
          >
            <ArchiveIcon size={14} />
            Ver expedientes archivados
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
