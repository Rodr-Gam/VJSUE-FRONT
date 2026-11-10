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

interface RoomPrice {
  id: number;
  occupancy_type: "single" | "double" | "triple" | "quadruple" | "suite";
  nightly_rate: string;
  total_rooms: number;
}

interface Hotel {
  id: number;
  reservation?: { user?: { name: string } };
  name: string;
  destination: string;
  hgdl_key: string;
  supplier: string;
  booking_source: string;
  provider_cost: string;
  client_cost?: string | null;
  profit?: number | string | null;
  observations: string;
  room_prices?: RoomPrice[];
}

const ocupacionLabel: Record<RoomPrice["occupancy_type"], string> = {
  single: "Individual",
  double: "Doble",
  triple: "Triple",
  quadruple: "Cuádruple",
  suite: "Suite",
};

function HotelActions({
  hotelId,
  onDelete,
}: {
  hotelId: number;
  onDelete: () => void;
}) {
  return (
    <div className="adm-actions">
      <Link
        to={`/admin/hotel/${hotelId}`}
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

function RoomPricesList({ prices }: { prices?: RoomPrice[] }) {
  if (!prices?.length) {
    return <span className="adm-cell-muted">Sin precios</span>;
  }
  return (
    <ul className="space-y-0.5">
      {prices.map((rp) => (
        <li key={rp.id} className="text-[0.72rem] text-slate-600 whitespace-nowrap">
          {ocupacionLabel[rp.occupancy_type]}:{" "}
          <span className="font-semibold">
            ${formatAdminMoney(rp.nightly_rate)} extra
          </span>{" "}
          ({rp.total_rooms} hab.)
        </li>
      ))}
    </ul>
  );
}

export default function VerHoteles() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroDestino, setFiltroDestino] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [modalEliminar, setModalEliminar] = useState<number | null>(null);
  const { mensaje, mostrarMensaje } = useToast();

  const cargarHoteles = async () => {
    try {
      const response = await api.get("/hotels");
      setHotels(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      mostrarMensaje("Error al cargar los hoteles.", "error");
    }
  };

  useEffect(() => {
    cargarHoteles();
  }, []);

  const hotelesFiltrados = hotels.filter((hotel) => {
    const q = busqueda.toLowerCase();
    const coincideBusqueda =
      hotel.reservation?.user?.name?.toLowerCase().includes(q) ||
      hotel.name?.toLowerCase().includes(q) ||
      hotel.destination?.toLowerCase().includes(q) ||
      hotel.hgdl_key?.toLowerCase().includes(q) ||
      hotel.supplier?.toLowerCase().includes(q);

    const coincideDestino = filtroDestino
      ? hotel.destination === filtroDestino
      : true;
    const coincideProveedor = filtroProveedor
      ? hotel.supplier === filtroProveedor
      : true;

    return coincideBusqueda && coincideDestino && coincideProveedor;
  });

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginated: hotelesPaginados,
  } = usePagination(hotelesFiltrados, 10);

  const handleEliminar = async () => {
    if (modalEliminar === null) return;
    try {
      await api.delete(`/hotels/${modalEliminar}`);
      setModalEliminar(null);
      cargarHoteles();
      mostrarMensaje("Hotel eliminado correctamente.", "success");
    } catch (error: unknown) {
      setModalEliminar(null);
      const err = error as { response?: { data?: { message?: string } } };
      mostrarMensaje(
        err.response?.data?.message || "Error al eliminar el hotel.",
        "error",
      );
    }
  };

  const destinos = [...new Set(hotels.map((h) => h.destination).filter(Boolean))];
  const proveedores = [...new Set(hotels.map((h) => h.supplier).filter(Boolean))];

  return (
    <AdminLayout>
      <div className="adm-list-page">
        <div className="adm-list-toolbar">
          <div className="adm-list-toolbar-grid adm-toolbar-4">
            <label className="adm-list-search">
              <SearchIcon size={18} className="text-[#d3a762] shrink-0" />
              <input
                type="text"
                placeholder="Buscar cliente, hotel, destino o clave..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>
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
            <select
              value={filtroProveedor}
              onChange={(e) => {
                setFiltroProveedor(e.target.value);
                setCurrentPage(1);
              }}
              className="adm-list-select"
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor} value={proveedor}>
                  {proveedor}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="adm-list-card">
          <div className="adm-list-head">
            <h2 className="adm-list-title">Todos los hoteles</h2>
            <span className="adm-list-count">{hotels.length} hoteles</span>
          </div>

          {hotelesFiltrados.length === 0 && (
            <p className="adm-empty">No se encontraron hoteles con esos filtros.</p>
          )}

          {hotelesFiltrados.length > 0 && (
            <>
              <div className="hidden md:block adm-table-wrap">
                <table className="adm-table adm-table--xl">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Hotel</th>
                      <th>Destino</th>
                      <th>Proveedor</th>
                      <th>Clave</th>
                      <th>Reservación</th>
                      <th>Costo plataforma</th>
                      <th>Costo agencia</th>
                      <th>Ganancia</th>
                      <th>Habitaciones</th>
                      <th>Notas</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotelesPaginados.map((hotel) => (
                      <tr key={hotel.id}>
                        <td>{hotel.reservation?.user?.name || "—"}</td>
                        <td className="adm-cell-strong">{hotel.name || "—"}</td>
                        <td>{hotel.destination || "—"}</td>
                        <td>{hotel.supplier || "—"}</td>
                        <td>{hotel.hgdl_key || "—"}</td>
                        <td>{hotel.booking_source || "—"}</td>
                        <td>${formatAdminMoney(hotel.provider_cost)}</td>
                        <td>
                          {hotel.client_cost
                            ? `$${formatAdminMoney(hotel.client_cost)}`
                            : "—"}
                        </td>
                        <td className="font-semibold text-emerald-700">
                          {(() => {
                            const profit = profitFromRecord(
                              hotel.profit,
                              hotel.client_cost,
                              hotel.provider_cost,
                            );
                            return profit !== null
                              ? `$${formatAdminMoney(profit)}`
                              : "—";
                          })()}
                        </td>
                        <td>
                          <RoomPricesList prices={hotel.room_prices} />
                        </td>
                        <td className="adm-cell-notes">
                          {hotel.observations || "—"}
                        </td>
                        <td>
                          <HotelActions
                            hotelId={hotel.id}
                            onDelete={() => setModalEliminar(hotel.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {hotelesPaginados.map((hotel) => (
                  <article key={hotel.id} className="adm-mobile-card">
                    <div className="adm-mobile-card-head">
                      <div>
                        <h3 className="adm-mobile-card-title">
                          {hotel.name || "—"}
                        </h3>
                        <p className="adm-mobile-card-sub">
                          {hotel.destination || "—"}
                        </p>
                      </div>
                      <HotelActions
                        hotelId={hotel.id}
                        onDelete={() => setModalEliminar(hotel.id)}
                      />
                    </div>
                    <div className="adm-mobile-grid">
                      <p>
                        <span>Cliente</span>
                        {hotel.reservation?.user?.name || "—"}
                      </p>
                      <p>
                        <span>Proveedor</span>
                        {hotel.supplier || "—"}
                      </p>
                      <p>
                        <span>Plataforma</span>
                        ${formatAdminMoney(hotel.provider_cost)}
                      </p>
                      <p>
                        <span>Agencia</span>
                        {hotel.client_cost
                          ? `$${formatAdminMoney(hotel.client_cost)}`
                          : "—"}
                      </p>
                      <p>
                        <span>Ganancia</span>
                        {(() => {
                          const profit = profitFromRecord(
                            hotel.profit,
                            hotel.client_cost,
                            hotel.provider_cost,
                          );
                          return profit !== null
                            ? `$${formatAdminMoney(profit)}`
                            : "—";
                        })()}
                      </p>
                      <p>
                        <span>Clave</span>
                        {hotel.hgdl_key || "—"}
                      </p>
                    </div>
                    {hotel.room_prices && hotel.room_prices.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <RoomPricesList prices={hotel.room_prices} />
                      </div>
                    )}
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
        title="¿Eliminar hotel?"
        onCancel={() => setModalEliminar(null)}
        onConfirm={handleEliminar}
      />
    </AdminLayout>
  );
}
