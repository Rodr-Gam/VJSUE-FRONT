import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../../api";
import { parseApiValidationErrors } from "../../utils/apiHelpers";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "success" | "error";
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    if (password.length < 8) {
      setMensaje({
        texto: "La contraseña debe tener al menos 8 caracteres.",
        tipo: "error",
      });
      return;
    }

    if (password !== passwordConfirmation) {
      setMensaje({ texto: "Las contraseñas no coinciden.", tipo: "error" });
      return;
    }

    if (!token || !email) {
      setMensaje({
        texto: "El enlace de recuperación no es válido o ha expirado.",
        tipo: "error",
      });
      return;
    }

    try {
      setLoading(true);
      await api.post("/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      setMensaje({
        texto: "Contraseña actualizada con éxito.",
        tipo: "success",
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: unknown) {
      setMensaje({
        texto: parseApiValidationErrors(
          error,
          "Error al restablecer la contraseña.",
        ),
        tipo: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-[#d3a762] mb-6">
          Restablecer contraseña
        </h2>

        {mensaje && (
          <div
            className={`mb-4 p-3 rounded flex items-center gap-2 ${
              mensaje.tipo === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <span>{mensaje.tipo === "success" ? "✓" : "!"}</span>
            <span>{mensaje.texto}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Nueva contraseña
            </span>
            <input
              required
              type="password"
              minLength={8}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#d3a762]"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Confirmar contraseña
            </span>
            <input
              required
              type="password"
              minLength={8}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#d3a762]"
              placeholder="Repite tu contraseña"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d3a762] text-white py-2 rounded font-semibold hover:bg-[#b8904f] transition"
          >
            {loading ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
