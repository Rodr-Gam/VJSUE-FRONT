import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AdminLayout from "../../../layouts/AdminLayout";
import LoadingScreen from "../../../components/Admin/LoadingScreen";
import { getClientById, updateClient } from "../../../clientService";
import type { ClientState } from "../../../types/client";
import "../../../styles/VerReserva.css";
import {
  ArrowBigLeftIcon,
  SaveAllIcon,
  UserPenIcon,
} from "lucide-react";

export default function EditarCliente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const clientId = Number(id);

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<ClientState>("active");
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(clientId)) {
      navigate("/admin/clientes");
      return;
    }

    getClientById(clientId)
      .then((client) => {
        setName(client.name ?? "");
        setLastName(client.last_name ?? "");
        setEmail(client.email ?? "");
        setPhone(client.phone ?? "");
        setState(client.state ?? "active");
      })
      .catch(() => {
        setMensaje({ texto: "No se pudo cargar el cliente.", tipo: "error" });
      })
      .finally(() => setLoadingData(false));
  }, [id, clientId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    try {
      setLoading(true);

      const response = await updateClient(clientId, {
        name: name.trim(),
        last_name: lastName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        state,
      });

      setMensaje({
        texto: response.message ?? "Cliente actualizado con éxito.",
        tipo: "success",
      });

      setTimeout(() => navigate("/admin/clientes"), 1500);
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(", ")
          : null) ||
        "Error al actualizar el cliente.";
      setMensaje({ texto: msg, tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <AdminLayout>
        <LoadingScreen icon={UserPenIcon} text="Cargando cliente..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="R-dashboard-cards">
        <div className="flex-1">
          <div className="R-card-tt flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="R-dashboard-title text-[#d3a762]">Editar cliente</h2>
            <Link
              to="/admin/clientes"
              className="text-sm text-[#193355] hover:text-[#d3a762] font-medium underline-offset-2 hover:underline"
            >
              Ver listado de clientes
            </Link>
          </div>

          <div className="R-card-f">
            <div className="flex items-center gap-2 mb-4">
              <UserPenIcon size={24} className="text-[#d3a762]" />
              <h3 className="text-lg font-bold text-black">
                Actualizar datos del cliente #{clientId}
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
                  Nombre
                  <input
                    required
                    type="text"
                    className="R-input"
                    placeholder="Ej. Juan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>

                <label className="R-label">
                  Apellido
                  <input
                    required
                    type="text"
                    className="R-input"
                    placeholder="Ej. Pérez"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </label>

                <label className="R-label">
                  Correo electrónico
                  <input
                    type="email"
                    className="R-input"
                    placeholder="Ej. juan@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <label className="R-label">
                  Teléfono
                  <input
                    type="text"
                    className="R-input"
                    placeholder="Ej. 3312345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>

                <label className="R-label">
                  Estado
                  <select
                    className="R-select"
                    value={state}
                    onChange={(e) => setState(e.target.value as ClientState)}
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="banned">Bloqueado</option>
                  </select>
                </label>

                <div className="flex items-center gap-2">
                  <Link
                    to="/admin/clientes"
                    className="R-button-f flex items-center gap-2 justify-center"
                  >
                    <ArrowBigLeftIcon size={18} />
                    Regresar
                  </Link>
                  <button
                    type="submit"
                    className="R-button-f flex items-center gap-2 h-18 justify-center"
                    disabled={loading}
                  >
                    <SaveAllIcon size={18} />
                    {loading ? "Guardando..." : "Guardar cambios"}
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
