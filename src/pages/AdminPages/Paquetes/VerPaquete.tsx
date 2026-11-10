import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import { packageService } from "../../../packageService";
import { PencilIcon, DeleteIcon, SearchIcon, Plus } from "lucide-react";
import { formatAdminDate, formatAdminMoney } from "../../../utils/adminFormat";

import Pagination from "../../../components/common/Pagination";
import ConfirmDeleteModal from "../../../components/common/ConfirmDeleteModal";
import Toast from "../../../components/common/Toast";
import { useToast } from "../../../hooks/useToast";
import { usePagination } from "../../../hooks/usePagination";

interface Package {
  id: number;
  name: string;
  description: string;
  city_id: number;
  duration: string;
  departure_date: string;
  return_date: string;
  stock: number;
  price_adult: number | string;
  price_junior: number | string;
  price_child: number | string;
  status: string;
  city?: { name: string };
}

function unwrapList<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response;
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.packages)) return obj.packages as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}

function formatPrecio(value: number | string): string {
  return formatAdminMoney(value);
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`adm-badge ${active ? "adm-badge--active" : "adm-badge--inactive"}`}>
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function PackageActions({
  pkgId,
  onDelete,
}: {
  pkgId: number;
  onDelete: () => void;
}) {
  return (
    <div className="adm-actions">
      <Link
        to={`/admin/editar-paquete/${pkgId}`}
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

export default function VerPaquetes() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroDestino, setFiltroDestino] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalEliminar, setModalEliminar] = useState<number | null>(null);
  const { mensaje, mostrarMensaje } = useToast();

  const cargarPaquetes = async () => {
    try {
      setLoading(true);
      const response = await packageService.getPackages();
      setPackages(unwrapList<Package>(response));
    } catch (error) {
      console.error(error);
      mostrarMensaje("No se pudieron cargar los paquetes.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPaquetes();
  }, []);

  const paquetesFiltrados = packages.filter((pkg) => {
    const term = busqueda.toLowerCase();
    const coincideBusqueda =
      (pkg.name || "").toLowerCase().includes(term) ||
      (pkg.description || "").toLowerCase().includes(term) ||
      (pkg.city?.name || "").toLowerCase().includes(term);

    const destino = pkg.city?.name || "";
    const coincideDestino = filtroDestino ? destino === filtroDestino : true;

    const estado = String(pkg.status || "").toLowerCase();
    const coincideEstado = filtroEstado ? estado === filtroEstado : true;

    return coincideBusqueda && coincideDestino && coincideEstado;
  });

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginated: paquetesPaginados,
  } = usePagination(paquetesFiltrados, 10);

  const handleEliminar = async () => {
    if (modalEliminar === null) return;
    try {
      await packageService.deletePackage(modalEliminar);
      setModalEliminar(null);
      cargarPaquetes();
      mostrarMensaje("Paquete eliminado correctamente.", "success");
    } catch (error: unknown) {
      setModalEliminar(null);
      const err = error as { response?: { data?: { message?: string } } };
      mostrarMensaje(
        err.response?.data?.message || "Error al eliminar el paquete.",
        "error",
      );
    }
  };

  const destinosUnicos = [
    ...new Set(packages.map((p) => p.city?.name).filter(Boolean)),
  ] as string[];

  return (
    <AdminLayout>
      <div className="adm-list-page">
        <div className="adm-list-toolbar">
          <div className="adm-list-toolbar-grid">
            <label className="adm-list-search">
              <SearchIcon size={18} className="text-[#d3a762] shrink-0" />
              <input
                type="text"
                placeholder="Buscar nombre, descripción o destino..."
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
              {destinosUnicos.map((destino) => (
                <option key={destino} value={destino}>
                  {destino}
                </option>
              ))}
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setCurrentPage(1);
              }}
              className="adm-list-select"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>

            <Link to="/admin/crear-paquete" className="adm-list-cta">
              <Plus size={16} aria-hidden="true" />
              Nuevo paquete
            </Link>
          </div>
        </div>

        <div className="adm-list-card">
          <div className="adm-list-head">
            <h2 className="adm-list-title">Todos los paquetes</h2>
            <div className="adm-list-meta">
              <span className="adm-list-count">
                {paquetesFiltrados.length} de {packages.length} paquetes
              </span>
            </div>
          </div>

          {loading && <p className="adm-empty">Cargando paquetes...</p>}

          {!loading && paquetesFiltrados.length === 0 && (
            <p className="adm-empty">No se encontraron paquetes con esos filtros.</p>
          )}

          {!loading && paquetesFiltrados.length > 0 && (
            <>
              <div className="hidden lg:block adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Paquete</th>
                      <th>Destino</th>
                      <th>Duración</th>
                      <th>Salida</th>
                      <th>Regreso</th>
                      <th>Cupos</th>
                      <th>Estado</th>
                      <th>Precios</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paquetesPaginados.map((pkg) => {
                      const isActivo =
                        String(pkg.status).toLowerCase() === "active";
                      return (
                        <tr key={pkg.id}>
                          <td className="adm-pkg-id">#{pkg.id}</td>
                          <td>
                            <div className="adm-pkg-name">{pkg.name || "—"}</div>
                            <div className="adm-pkg-desc">
                              {pkg.description || "Sin descripción"}
                            </div>
                          </td>
                          <td>{pkg.city?.name || "—"}</td>
                          <td>{pkg.duration || "—"}</td>
                          <td className="adm-date-cell">
                            {formatAdminDate(pkg.departure_date)}
                          </td>
                          <td className="adm-date-cell">
                            {formatAdminDate(pkg.return_date)}
                          </td>
                          <td className="adm-stock">{pkg.stock ?? 0}</td>
                          <td>
                            <StatusBadge active={isActivo} />
                          </td>
                          <td>
                            <div className="adm-prices">
                              <span className="adm-price-a">
                                Adulto: ${formatPrecio(pkg.price_adult)}
                              </span>
                              <span className="adm-price-j">
                                Juvenil: ${formatPrecio(pkg.price_junior)}
                              </span>
                              <span className="adm-price-n">
                                Niño: ${formatPrecio(pkg.price_child)}
                              </span>
                            </div>
                          </td>
                          <td>
                            <PackageActions
                              pkgId={pkg.id}
                              onDelete={() => setModalEliminar(pkg.id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden space-y-3">
                {paquetesPaginados.map((pkg) => {
                  const isActivo =
                    String(pkg.status).toLowerCase() === "active";
                  return (
                    <article key={pkg.id} className="adm-mobile-card">
                      <div className="adm-mobile-card-head">
                        <div>
                          <h3 className="adm-mobile-card-title">
                            {pkg.name || "—"}
                          </h3>
                          <p className="adm-mobile-card-sub">
                            #{pkg.id} · {pkg.city?.name || "Sin destino"}
                          </p>
                        </div>
                        <PackageActions
                          pkgId={pkg.id}
                          onDelete={() => setModalEliminar(pkg.id)}
                        />
                      </div>

                      <div className="adm-mobile-grid">
                        <p>
                          <span>Duración</span>
                          {pkg.duration || "—"}
                        </p>
                        <p>
                          <span>Estado</span>
                          <StatusBadge active={isActivo} />
                        </p>
                        <p>
                          <span>Salida</span>
                          {formatAdminDate(pkg.departure_date)}
                        </p>
                        <p>
                          <span>Regreso</span>
                          {formatAdminDate(pkg.return_date)}
                        </p>
                        <p>
                          <span>Cupos</span>
                          {pkg.stock ?? 0}
                        </p>
                      </div>

                      <div className="adm-mobile-prices">
                        <span className="adm-price-a">
                          A: ${formatPrecio(pkg.price_adult)}
                        </span>
                        <span className="adm-price-j">
                          Juvenil: ${formatPrecio(pkg.price_junior)}
                        </span>
                        <span className="adm-price-n">
                          N: ${formatPrecio(pkg.price_child)}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="justify-center lg:justify-end"
              />
            </>
          )}
        </div>
      </div>

      <Toast mensaje={mensaje} />

      <ConfirmDeleteModal
        isOpen={modalEliminar !== null}
        title="¿Eliminar paquete?"
        onCancel={() => setModalEliminar(null)}
        onConfirm={handleEliminar}
      />
    </AdminLayout>
  );
}
