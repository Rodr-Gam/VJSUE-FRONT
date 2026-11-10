import { useState, useEffect } from "react";
import { api } from "../../../api";
import { Link } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import { PencilIcon, DeleteIcon, SearchIcon } from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import ConfirmDeleteModal from "../../../components/common/ConfirmDeleteModal";
import Toast from "../../../components/common/Toast";
import { useToast } from "../../../hooks/useToast";
import { usePagination } from "../../../hooks/usePagination";
import { formatAdminMoney } from "../../../utils/adminFormat";
import { profitFromRecord } from "../../../utils/serviceProfit";

interface Flight {
  id: number;
  reservation?: { user?: { name: string } };
  airline_name: string;
  destination: string;
  flight_schedule: string;
  hgdl_key: string;
  booking_source: string;
  provider_cost: string;
  client_cost?: string | null;
  profit?: number | string | null;
  observations: string;
}

function FlightActions({
  flightId,
  onDelete,
}: {
  flightId: number;
  onDelete: () => void;
}) {
  return (
    <div className="adm-actions">
      <Link
        to={`/admin/vuelo/${flightId}`}
        title="Editar"
        className="R-btn-action R-btn-edit"
      >
        <PencilIcon size={18} className="text-[#d3a762]" />
      </Link>
      <button
        type="button"
        onClick={onDelete}
        title="Eliminar"
        className="R-btn-action R-btn-edit"
      >
        <DeleteIcon size={18} className="text-red-500" />
      </button>
    </div>
  );
}

export default function VerVuelos() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroAerolinea, setFiltroAerolinea] = useState("");
  const [filtroDestino, setFiltroDestino] = useState("");
  const [modalEliminar, setModalEliminar] = useState<number | null>(null);
  const { mensaje, mostrarMensaje } = useToast();

  const cargarFlight = async () => {
    try {
      const response = await api.get("/flights");
      setFlights(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    cargarFlight();
  }, []);

  const flightsFiltrados = flights.filter((flight) => {
    const term = busqueda.toLowerCase();
    const coincideBusqueda =
      flight.reservation?.user?.name?.toLowerCase().includes(term) ||
      flight.airline_name?.toLowerCase().includes(term) ||
      flight.destination?.toLowerCase().includes(term) ||
      flight.hgdl_key?.toLowerCase().includes(term);

    const coincideAerolinea = filtroAerolinea
      ? flight.airline_name === filtroAerolinea
      : true;
    const coincideDestino = filtroDestino
      ? flight.destination === filtroDestino
      : true;

    return coincideBusqueda && coincideAerolinea && coincideDestino;
  });

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginated: flightsPaginados,
  } = usePagination(flightsFiltrados, 10);

  const handleEliminar = async () => {
    if (modalEliminar === null) return;
    try {
      await api.delete(`/flights/${modalEliminar}`);
      setModalEliminar(null);
      cargarFlight();
      mostrarMensaje("Vuelo eliminado correctamente.", "success");
    } catch (error: unknown) {
      setModalEliminar(null);
      const err = error as { response?: { data?: { message?: string } } };
      mostrarMensaje(
        err.response?.data?.message || "Error al eliminar el vuelo.",
        "error",
      );
    }
  };

  const aerolineas = [...new Set(flights.map((f) => f.airline_name).filter(Boolean))];
  const destinos = [...new Set(flights.map((f) => f.destination).filter(Boolean))];

  return (
    <AdminLayout>
      <div className="adm-list-page">
        <div className="adm-list-toolbar">
          <div className="adm-list-toolbar-grid adm-toolbar-4">
            <label className="adm-list-search">
              <SearchIcon size={18} className="text-[#d3a762] shrink-0" />
              <input
                type="text"
                placeholder="Buscar cliente, aerolínea, destino o clave..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>
            <select
              value={filtroAerolinea}
              onChange={(e) => {
                setFiltroAerolinea(e.target.value);
                setCurrentPage(1);
              }}
              className="adm-list-select"
            >
              <option value="">Todas las aerolíneas</option>
              {aerolineas.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
            <select
              value={filtroDestino}
              onChange={(e) => {
                setFiltroDestino(e.target.value);
                setCurrentPage(1);
              }}
              className="adm-list-select"
            >
              <option value="">Todos los destinos</option>
              {destinos.map((destino) => (
                <option key={destino} value={destino}>
                  {destino}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="adm-list-card">
          <div className="adm-list-head">
            <h2 className="adm-list-title">Todos los vuelos</h2>
            <span className="adm-list-count">{flights.length} vuelos</span>
          </div>

          {flightsFiltrados.length === 0 && (
            <p className="adm-empty">No se encontraron vuelos con esos filtros.</p>
          )}

          {flightsFiltrados.length > 0 && (
            <>
              <div className="hidden md:block adm-table-wrap">
                <table className="adm-table adm-table--xl">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Aerolínea</th>
                      <th>Destino</th>
                      <th>Horario</th>
                      <th>Clave</th>
                      <th>Reservación</th>
                      <th>Costo plataforma</th>
                      <th>Costo agencia</th>
                      <th>Ganancia</th>
                      <th>Notas</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flightsPaginados.map((flight) => (
                      <tr key={flight.id}>
                        <td>{flight.reservation?.user?.name || "—"}</td>
                        <td className="adm-cell-strong">{flight.airline_name || "—"}</td>
                        <td>{flight.destination || "—"}</td>
                        <td>{flight.flight_schedule || "—"}</td>
                        <td>{flight.hgdl_key || "—"}</td>
                        <td>{flight.booking_source || "—"}</td>
                        <td>${formatAdminMoney(flight.provider_cost)}</td>
                        <td>
                          {flight.client_cost
                            ? `$${formatAdminMoney(flight.client_cost)}`
                            : "—"}
                        </td>
                        <td className="font-semibold text-emerald-700">
                          {(() => {
                            const profit = profitFromRecord(
                              flight.profit,
                              flight.client_cost,
                              flight.provider_cost,
                            );
                            return profit !== null
                              ? `$${formatAdminMoney(profit)}`
                              : "—";
                          })()}
                        </td>
                        <td className="adm-cell-notes">
                          {flight.observations || "—"}
                        </td>
                        <td>
                          <FlightActions
                            flightId={flight.id}
                            onDelete={() => setModalEliminar(flight.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {flightsPaginados.map((flight) => (
                  <article key={flight.id} className="adm-mobile-card">
                    <div className="adm-mobile-card-head">
                      <div>
                        <h3 className="adm-mobile-card-title">
                          {flight.airline_name || "—"}
                        </h3>
                        <p className="adm-mobile-card-sub">
                          {flight.destination || "—"}
                        </p>
                      </div>
                      <FlightActions
                        flightId={flight.id}
                        onDelete={() => setModalEliminar(flight.id)}
                      />
                    </div>
                    <div className="adm-mobile-grid">
                      <p>
                        <span>Cliente</span>
                        {flight.reservation?.user?.name || "—"}
                      </p>
                      <p>
                        <span>Horario</span>
                        {flight.flight_schedule || "—"}
                      </p>
                      <p>
                        <span>Clave</span>
                        {flight.hgdl_key || "—"}
                      </p>
                      <p>
                        <span>Plataforma</span>${formatAdminMoney(flight.provider_cost)}
                      </p>
                      <p>
                        <span>Agencia</span>
                        {flight.client_cost
                          ? `$${formatAdminMoney(flight.client_cost)}`
                          : "—"}
                      </p>
                      <p>
                        <span>Ganancia</span>
                        {(() => {
                          const profit = profitFromRecord(
                            flight.profit,
                            flight.client_cost,
                            flight.provider_cost,
                          );
                          return profit !== null
                            ? `$${formatAdminMoney(profit)}`
                            : "—";
                        })()}
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

      <Toast mensaje={mensaje} />
      <ConfirmDeleteModal
        isOpen={modalEliminar !== null}
        title="¿Eliminar vuelo?"
        onCancel={() => setModalEliminar(null)}
        onConfirm={handleEliminar}
      />
    </AdminLayout>
  );
}
