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

interface Transport {
  id: number;
  reservation?: { user?: { name: string } };
  company: string;
  destination: string;
  horary: string;
  supplier: string;
  hgdl_key: string;
  booking_source: string;
  provider_cost: string;
  client_cost?: string | null;
  profit?: number | string | null;
  observations: string;
}

function TransportActions({
  transportId,
  onDelete,
}: {
  transportId: number;
  onDelete: () => void;
}) {
  return (
    <div className="adm-actions">
      <Link
        to={`/admin/transporte/${transportId}`}
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

export default function VerTransportes() {
  const [transports, setTransports] = useState<Transport[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroDestino, setFiltroDestino] = useState("");
  const [modalEliminar, setModalEliminar] = useState<number | null>(null);
  const { mensaje, mostrarMensaje } = useToast();

  const cargarTransport = async () => {
    try {
      const response = await api.get("/transports");
      setTransports(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    cargarTransport();
  }, []);

  const transportsFiltrados = transports.filter((transport) => {
    const term = busqueda.toLowerCase();
    const coincideBusqueda =
      transport.reservation?.user?.name?.toLowerCase().includes(term) ||
      transport.company?.toLowerCase().includes(term) ||
      transport.destination?.toLowerCase().includes(term) ||
      transport.hgdl_key?.toLowerCase().includes(term);

    const coincideEmpresa = filtroEmpresa
      ? transport.company === filtroEmpresa
      : true;
    const coincideDestino = filtroDestino
      ? transport.destination === filtroDestino
      : true;

    return coincideBusqueda && coincideEmpresa && coincideDestino;
  });

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginated: transportsPaginados,
  } = usePagination(transportsFiltrados, 10);

  const handleEliminar = async () => {
    if (modalEliminar === null) return;
    try {
      await api.delete(`/transports/${modalEliminar}`);
      setModalEliminar(null);
      cargarTransport();
      mostrarMensaje("Transporte eliminado correctamente.", "success");
    } catch (error: unknown) {
      setModalEliminar(null);
      const err = error as { response?: { data?: { message?: string } } };
      mostrarMensaje(
        err.response?.data?.message || "Error al eliminar el transporte.",
        "error",
      );
    }
  };

  const empresas = [...new Set(transports.map((t) => t.company).filter(Boolean))];
  const destinos = [...new Set(transports.map((t) => t.destination).filter(Boolean))];

  return (
    <AdminLayout>
      <div className="adm-list-page">
        <div className="adm-list-toolbar">
          <div className="adm-list-toolbar-grid adm-toolbar-4">
            <label className="adm-list-search">
              <SearchIcon size={18} className="text-[#d3a762] shrink-0" />
              <input
                type="text"
                placeholder="Buscar cliente, empresa, destino o clave..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>
            <select
              value={filtroEmpresa}
              onChange={(e) => {
                setFiltroEmpresa(e.target.value);
                setCurrentPage(1);
              }}
              className="adm-list-select"
            >
              <option value="">Todas las empresas</option>
              {empresas.map((nombre) => (
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
            <h2 className="adm-list-title">Todos los transportes</h2>
            <span className="adm-list-count">{transports.length} registros</span>
          </div>

          {transportsFiltrados.length === 0 && (
            <p className="adm-empty">
              No se encontraron transportes con esos filtros.
            </p>
          )}

          {transportsFiltrados.length > 0 && (
            <>
              <div className="hidden md:block adm-table-wrap">
                <table className="adm-table adm-table--xl">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Empresa</th>
                      <th>Destino</th>
                      <th>Horario</th>
                      <th>Proveedor</th>
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
                    {transportsPaginados.map((transport) => (
                      <tr key={transport.id}>
                        <td>{transport.reservation?.user?.name || "—"}</td>
                        <td className="adm-cell-strong">{transport.company || "—"}</td>
                        <td>{transport.destination || "—"}</td>
                        <td>{transport.horary || "—"}</td>
                        <td>{transport.supplier || "—"}</td>
                        <td>{transport.hgdl_key || "—"}</td>
                        <td>{transport.booking_source || "—"}</td>
                        <td>${formatAdminMoney(transport.provider_cost)}</td>
                        <td>
                          {transport.client_cost
                            ? `$${formatAdminMoney(transport.client_cost)}`
                            : "—"}
                        </td>
                        <td className="font-semibold text-emerald-700">
                          {(() => {
                            const profit = profitFromRecord(
                              transport.profit,
                              transport.client_cost,
                              transport.provider_cost,
                            );
                            return profit !== null
                              ? `$${formatAdminMoney(profit)}`
                              : "—";
                          })()}
                        </td>
                        <td className="adm-cell-notes">
                          {transport.observations || "—"}
                        </td>
                        <td>
                          <TransportActions
                            transportId={transport.id}
                            onDelete={() => setModalEliminar(transport.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {transportsPaginados.map((transport) => (
                  <article key={transport.id} className="adm-mobile-card">
                    <div className="adm-mobile-card-head">
                      <div>
                        <h3 className="adm-mobile-card-title">
                          {transport.company || "—"}
                        </h3>
                        <p className="adm-mobile-card-sub">
                          {transport.destination || "—"}
                        </p>
                      </div>
                      <TransportActions
                        transportId={transport.id}
                        onDelete={() => setModalEliminar(transport.id)}
                      />
                    </div>
                    <div className="adm-mobile-grid">
                      <p>
                        <span>Cliente</span>
                        {transport.reservation?.user?.name || "—"}
                      </p>
                      <p>
                        <span>Horario</span>
                        {transport.horary || "—"}
                      </p>
                      <p>
                        <span>Proveedor</span>
                        {transport.supplier || "—"}
                      </p>
                      <p>
                        <span>Plataforma</span>
                        ${formatAdminMoney(transport.provider_cost)}
                      </p>
                      <p>
                        <span>Agencia</span>
                        {transport.client_cost
                          ? `$${formatAdminMoney(transport.client_cost)}`
                          : "—"}
                      </p>
                      <p>
                        <span>Ganancia</span>
                        {(() => {
                          const profit = profitFromRecord(
                            transport.profit,
                            transport.client_cost,
                            transport.provider_cost,
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
        title="¿Eliminar transporte?"
        onCancel={() => setModalEliminar(null)}
        onConfirm={handleEliminar}
      />
    </AdminLayout>
  );
}
