import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import { packageService } from "../../../packageService";
import { formatAdminDate } from "../../../utils/adminFormat";
import Pagination from "../../../components/common/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { Plus, SearchIcon } from "lucide-react";

interface City {
  id: number;
  name: string;
  country?: string;
  created_at?: string;
}

function unwrapCities(response: unknown): City[] {
  if (Array.isArray(response)) return response;
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.cities)) return obj.cities as City[];
    if (Array.isArray(obj.data)) return obj.data as City[];
  }
  return [];
}

export default function VerCiudad() {
  const [cities, setCities] = useState<City[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    packageService
      .getCities()
      .then((data) => setCities(unwrapCities(data)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const ciudadesFiltradas = cities.filter((city) => {
    const term = busqueda.toLowerCase();
    return (
      (city.name || "").toLowerCase().includes(term) ||
      (city.country || "").toLowerCase().includes(term)
    );
  });

  const { currentPage, setCurrentPage, totalPages, paginated: ciudadesPaginadas } =
    usePagination(ciudadesFiltradas, 10);

  return (
    <AdminLayout>
      <div className="adm-list-page">
        <div className="adm-list-toolbar">
          <div className="adm-list-toolbar-grid adm-toolbar-2">
            <label className="adm-list-search">
              <SearchIcon size={18} className="text-[#d3a762] shrink-0" />
              <input
                type="text"
                placeholder="Buscar ciudad o país..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>
            <Link to="/admin/crear-ciudad" className="adm-list-cta">
              <Plus size={16} aria-hidden="true" />
              Nuevo destino
            </Link>
          </div>
        </div>

        <div className="adm-list-card">
          <div className="adm-list-head">
            <h2 className="adm-list-title">Todos los destinos</h2>
            <span className="adm-list-count">{ciudadesFiltradas.length} destinos</span>
          </div>

          {loading && <p className="adm-empty">Cargando destinos...</p>}
          {!loading && ciudadesFiltradas.length === 0 && (
            <p className="adm-empty">No se encontraron ciudades.</p>
          )}

          {!loading && ciudadesFiltradas.length > 0 && (
            <>
              <div className="hidden md:block adm-table-wrap">
                <table className="adm-table adm-table--md">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Ciudad / Destino</th>
                      <th>País</th>
                      <th>Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ciudadesPaginadas.map((city) => (
                      <tr key={city.id}>
                        <td className="adm-pkg-id">#{city.id}</td>
                        <td className="adm-cell-strong">{city.name || "—"}</td>
                        <td>{city.country || "—"}</td>
                        <td className="adm-date-cell">
                          {formatAdminDate(city.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {ciudadesPaginadas.map((city) => (
                  <article key={city.id} className="adm-mobile-card">
                    <h3 className="adm-mobile-card-title">{city.name || "—"}</h3>
                    <p className="adm-mobile-card-sub">#{city.id}</p>
                    <div className="adm-mobile-grid">
                      <p>
                        <span>País</span>
                        {city.country || "—"}
                      </p>
                      <p>
                        <span>Registro</span>
                        {formatAdminDate(city.created_at)}
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
