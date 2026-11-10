import { Link } from "react-router-dom";
import { useState } from "react";
import { api } from "../../../api";
import AdminLayout from "../../../layouts/AdminLayout";
import "../../../styles/VerReserva.css";
import { SaveAllIcon, UserPlusIcon } from "lucide-react";

export default function CrearCliente() {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("active");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "success" | "error";
  } | null>(null);

  const generarPasswordTemporal = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    return Array.from({ length: 10 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    const passwordTemporal = generarPasswordTemporal();

    try {
      setLoading(true);

      await api.post("/users", {
        name: name.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password: passwordTemporal,
        phone: phone.trim(),
        state,
        role_id: 2,
        send_welcome_email: true,
      });

      setMensaje({
        texto:
          "Cliente creado. Se le envió un correo para establecer su contraseña.",
        tipo: "success",
      });

      // Limpiar formulario
      setName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setState("active");
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(", ")
          : null) ||
        "Error al crear el cliente.";
      setMensaje({ texto: msg, tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="R-dashboard-cards">
        <div className="flex-1">
          <div className="R-card-tt flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="R-dashboard-title text-[#d3a762]">Crear cliente</h2>
            <Link
              to="/admin/clientes"
              className="text-sm text-[#193355] hover:text-[#d3a762] font-medium underline-offset-2 hover:underline"
            >
              Ver listado de clientes
            </Link>
          </div>

          <div className="R-card-f">
            <div className="flex items-center gap-2 mb-4">
              <UserPlusIcon size={24} className="text-[#d3a762]" />
              <h3 className="text-lg font-bold text-black">
                Registrar nuevo cliente
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
                    required
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
                    onChange={(e) => setState(e.target.value)}
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="banned">Bloqueado</option>
                  </select>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="R-button-f flex items-center gap-2 h-18 justify-center"
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
