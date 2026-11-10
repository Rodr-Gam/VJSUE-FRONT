import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../api";
import AdminLayout from "../../../layouts/AdminLayout";
import { PencilIcon, SearchIcon } from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { unwrapReservationList } from "../../../utils/apiHelpers";
import { formatAdminDate } from "../../../utils/adminFormat";

interface Reservation {
  id: number;
  reference_person: string;
  state: string;
  departure_date: string;
  return_date: string;
  reserved_seats: number;
  package?: {
    name: string;
    city?: { name: string };
    user?: { name: string };
  };
  user?: { name: string };
}

const STATE_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  canceled: "Cancelada",
  cancelled: "Cancelada",
  finished: "Finalizada",
  paid: "Pagada",
};

const STATE_BADGE: Record<string, string> = {
  confirmed: "adm-badge adm-badge--confirmed",
  paid: "adm-badge adm-badge--paid",
  pending: "adm-badge adm-badge--pending",
  canceled: "adm-badge adm-badge--cancelled",
  cancelled: "adm-badge adm-badge--cancelled",
  finished: "adm-badge adm-badge--finished",
};

function StateBadge({ state }: { state: string }) {
  const label = STATE_LABELS[state] || state;
  const className = STATE_BADGE[state] || "adm-badge adm-badge--info";
  return <span className={className}>{label}</span>;
}

export default function VerPasajeros() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/reservations");
        setReservations(unwrapReservationList<Reservation>(res.data));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const listasFiltradas = reservations.filter((reserva) => {
    const term = busqueda.toLowerCase();
    const cliente =
      reserva.user?.name ||
      reserva.package?.user?.name ||
      reserva.reference_person ||
      "";
    return (
      cliente.toLowerCase().includes(term) ||
      (reserva.reference_person || "").toLowerCase().includes(term) ||
      (reserva.package?.name || "").toLowerCase().includes(term) ||
      (reserva.package?.city?.name || "").toLowerCase().includes(term)
    );
  });

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginated: listasPaginadas,
  } = usePagination(listasFiltradas, 10);

  return (
    <AdminLayout>
      <div className="adm-list-page">
        <div className="adm-list-toolbar">
          <div className="adm-list-toolbar-grid adm-toolbar-2">
            <label className="adm-list-search">
              <SearchIcon size={18} className="text-[#d3a762] shrink-0" />
              <input
                type="text"
                placeholder="Buscar cliente, referencia, paquete o destino..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>
          </div>
        </div>

        <div className="adm-list-card">
          <div className="adm-list-head">
            <h2 className="adm-list-title">Listas de pasajeros</h2>
            <span className="adm-list-count">{reservations.length} listas</span>
          </div>

          {loading && <p className="adm-empty">Cargando listas de pasajeros...</p>}
          {!loading && listasFiltradas.length === 0 && (
            <p className="adm-empty">No se encontraron listas con esos filtros.</p>
          )}

          {!loading && listasFiltradas.length > 0 && (
            <>
              <div className="hidden md:block adm-table-wrap">
                <table className="adm-table adm-table--lg">
                  <thead>
                    <tr>
                      <th>Reserva</th>
                      <th>Cliente / Referencia</th>
                      <th>Paquete</th>
                      <th>Destino</th>
                      <th>Pasajeros</th>
                      <th>Salida</th>
                      <th>Regreso</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listasPaginadas.map((reserva) => (
                      <tr key={reserva.id}>
                        <td className="adm-pkg-id">#{reserva.id}</td>
                        <td>
                          <div className="adm-cell-strong">
                            {reserva.user?.name ||
                              reserva.package?.user?.name ||
                              "—"}
                          </div>
                          <div className="adm-cell-muted">
                            {reserva.reference_person || "Sin referencia"}
                          </div>
                        </td>
                        <td>{reserva.package?.name || "—"}</td>
                        <td>{reserva.package?.city?.name || "—"}</td>
                        <td className="adm-stock">{reserva.reserved_seats ?? 0}</td>
                        <td className="adm-date-cell">
                          {formatAdminDate(reserva.departure_date)}
                        </td>
                        <td className="adm-date-cell">
                          {formatAdminDate(reserva.return_date)}
                        </td>
                        <td>
                          <StateBadge state={reserva.state} />
                        </td>
                        <td>
                          <Link
                            to={`/admin/reservas/${reserva.id}`}
                            title="Editar reserva"
                            className="R-btn-action R-btn-edit"
                          >
                            <PencilIcon size={18} className="text-[#d3a762]" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {listasPaginadas.map((reserva) => (
                  <article key={reserva.id} className="adm-mobile-card">
                    <div className="adm-mobile-card-head">
                      <div>
                        <h3 className="adm-mobile-card-title">
                          Reserva #{reserva.id}
                        </h3>
                        <p className="adm-mobile-card-sub">
                          {reserva.user?.name ||
                            reserva.package?.user?.name ||
                            "—"}
                        </p>
                      </div>
                      <Link
                        to={`/admin/reservas/${reserva.id}`}
                        className="R-btn-action R-btn-edit"
                        title="Editar reserva"
                      >
                        <PencilIcon size={18} className="text-[#d3a762]" />
                      </Link>
                    </div>
                    <div className="adm-mobile-grid">
                      <p>
                        <span>Paquete</span>
                        {reserva.package?.name || "—"}
                      </p>
                      <p>
                        <span>Pasajeros</span>
                        {reserva.reserved_seats ?? 0}
                      </p>
                      <p>
                        <span>Salida</span>
                        {formatAdminDate(reserva.departure_date)}
                      </p>
                      <p>
                        <span>Estado</span>
                        <StateBadge state={reserva.state} />
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
