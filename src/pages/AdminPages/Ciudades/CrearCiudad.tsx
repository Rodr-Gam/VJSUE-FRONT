import { useEffect, useState } from "react";
import AdminLayout from "../../../layouts/AdminLayout";
import { packageService } from "../../../packageService";
import {
  duplicateCityMessage,
  findDuplicateCity,
  type CityRecord,
} from "../../../utils/cityValidation";
import "../../../styles/VerReserva.css";
import { SaveAllIcon, MapPinIcon } from "lucide-react";

export default function CrearCiudad() {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("México");
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<CityRecord[]>([]);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "success" | "error";
  } | null>(null);

  useEffect(() => {
    packageService
      .getCities()
      .then((data) => setCities(Array.isArray(data) ? data : []))
      .catch(() => setCities([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedCountry = country.trim() || "México";

    if (trimmedName === "") {
      setMensaje({
        texto: "El nombre de la ciudad es obligatorio.",
        tipo: "error",
      });
      return;
    }

    const duplicate = findDuplicateCity(cities, trimmedName, trimmedCountry);
    if (duplicate) {
      setMensaje({
        texto: duplicateCityMessage(trimmedName, trimmedCountry),
        tipo: "error",
      });
      return;
    }

    setLoading(true);
    setMensaje(null);

    try {
      const data = await packageService.createCity({
        name: trimmedName,
        country: trimmedCountry,
      });

      setMensaje({
        texto:
          data.message ||
          `Destino "${trimmedName}" (${trimmedCountry}) registrado con éxito.`,
        tipo: "success",
      });
      if (data.city) {
        setCities((prev) => [...prev, data.city]);
      }
      setName("");
      setCountry("México");
    } catch (error: unknown) {
      const err = error as {
        response?: {
          status?: number;
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };
      const apiErrors = err.response?.data?.errors;
      const firstFieldError =
        apiErrors?.name?.[0] ||
        apiErrors?.country?.[0] ||
        Object.values(apiErrors || {})[0]?.[0];

      setMensaje({
        texto:
          firstFieldError ||
          err.response?.data?.message ||
          "Error al conectar con el servidor.",
        tipo: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="R-dashboard-cards">
        <div className="flex-1">
          <div className="R-card-tt">
            <h2 className="R-dashboard-title text-[#d3a762]">Nuevo destino</h2>
          </div>
          <div className="R-card-f">
            <div className="flex items-center gap-2 mb-4">
              <MapPinIcon size={24} className="text-[#d3a762]" />
              <h3 className="text-lg font-bold text-black">
                Registra una nueva ciudad destino
              </h3>
            </div>

            {mensaje && (
              <div className={`cc-alert cc-alert--${mensaje.tipo}`}>
                <span className="cc-alert-icon">
                  {mensaje.tipo === "success" ? "✓" : "!"}
                </span>
                <span>{mensaje.texto}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                <label className="R-label">
                  Nombre de la ciudad
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setMensaje(null);
                      setName(e.target.value);
                    }}
                    className="R-input"
                    placeholder="Ej. Cancún, Monterrey, París"
                  />
                </label>

                <label className="R-label">
                  País
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => {
                      setMensaje(null);
                      setCountry(e.target.value);
                    }}
                    className="R-input"
                    placeholder="Ej. México, Francia, Japón"
                  />
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="R-button-f flex items-center gap-2 h-18 justify-center cursor-pointer"
                    disabled={loading}
                  >
                    <SaveAllIcon size={18} />
                    {loading ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
