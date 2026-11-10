import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plane, ArrowRight, ShieldCheck } from "lucide-react";
import "../../styles/RegistrarCliente.css";
import { authService } from "../../authService";
import Logo from "../../assets/LogoViajes512x512.png";

const DESTINATIONS = [
  { code: "IT", name: "Roma" },
  { code: "JP", name: "Tokio" },
  { code: "FR", name: "París" },
  { code: "MX", name: "Cancún" },
  { code: "GR", name: "Santorini" },
];

export default function RegistrarCliente() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [formData, setFormData] = useState({
    name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    role_id: 2,
  });

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "error" | "success";
  } | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    try {
      const data = await authService.register(formData);
      setMensaje({
        texto: data.message || "¡Cuenta creada con éxito!",
        tipo: "success",
      });
      setFormData({
        name: "",
        last_name: "",
        email: "",
        password: "",
        phone: "",
        role_id: 2,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setMensaje({
        texto:
          err.response?.data?.message ||
          "Error al registrar. Revisa los campos.",
        tipo: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: "name",
      label: "Nombre",
      type: "text",
      placeholder: "Ej. Juan",
      full: false,
    },
    {
      name: "last_name",
      label: "Apellidos",
      type: "text",
      placeholder: "Ej. Pérez Gómez",
      full: false,
    },
    {
      name: "phone",
      label: "Teléfono",
      type: "tel",
      placeholder: "Ej. 33 1234 5678",
      full: true,
    },
    {
      name: "email",
      label: "Correo electrónico",
      type: "email",
      placeholder: "correo@ejemplo.com",
      full: true,
    },
    {
      name: "password",
      label: "Contraseña",
      type: "password",
      placeholder: "Mínimo 8 caracteres",
      full: true,
    },
  ] as const;

  const loginHref = redirectTo
    ? `/login?redirect=${encodeURIComponent(redirectTo)}`
    : "/login";

  return (
    <div className="rc-root">
      <div className="rc-bg" aria-hidden="true">
        <div className="rc-bg-orb rc-bg-orb--1" />
        <div className="rc-bg-orb rc-bg-orb--2" />
        <div className="rc-grid-lines" />
      </div>

      <div className="rc-side-deco" aria-hidden="true">
        <span className="rc-side-text">
          VIAJES SUEÑA · EST. 2024 · EXPERIENCIAS ÚNICAS
        </span>
      </div>

      <div className="rc-wrapper">
        <div className="rc-card">
          <div className="rc-header">
            <div className="rc-logo-wrap">
              <img src={Logo} alt="" className="rc-logo-img" />
              <div>
                <h1 className="rc-brand">Viajes Sueña</h1>
                <p className="rc-tagline">Experiencias que inspiran</p>
              </div>
            </div>

            <div className="rc-divider">
              <span className="rc-divider-line" />
              <span className="rc-divider-diamond">◆</span>
              <span className="rc-divider-line" />
            </div>

            <div className="rc-title-wrap">
              <h2 className="rc-title">Nuevo cliente</h2>
              <p className="rc-subtitle">
                Crea una cuenta y comienza tu próxima aventura
              </p>
            </div>
          </div>

          {mensaje && (
            <div className={`rc-alert rc-alert--${mensaje.tipo}`} role="alert">
              <span className="rc-alert-icon">
                {mensaje.tipo === "success" ? "✓" : "!"}
              </span>
              <span>{mensaje.texto}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="rc-form">
            <div className="rc-fields-grid">
              {fields.map((field, i) => (
                <div
                  key={field.name}
                  className={`rc-field-wrap ${field.full ? "rc-field-wrap--full" : ""} ${focusedField === field.name ? "rc-field-wrap--focused" : ""}`}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <label className="rc-label" htmlFor={field.name}>
                    {field.label}
                  </label>
                  <div className="rc-input-wrap">
                    <input
                      id={field.name}
                      type={field.type}
                      name={field.name}
                      required={field.name !== "phone"}
                      value={formData[field.name]}
                      onChange={handleChange}
                      onFocus={() => setFocusedField(field.name)}
                      onBlur={() => setFocusedField(null)}
                      className="rc-input"
                      placeholder={field.placeholder}
                      autoComplete={
                        field.name === "password"
                          ? "new-password"
                          : field.name === "email"
                            ? "email"
                            : "off"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`rc-btn ${loading ? "rc-btn--loading" : ""}`}
            >
              {loading ? (
                <span className="rc-btn-inner">
                  <span className="rc-spinner" />
                  Registrando...
                </span>
              ) : (
                <span className="rc-btn-inner">
                  <span>Crear cuenta</span>
                  <ArrowRight size={18} className="rc-btn-arrow-icon" />
                </span>
              )}
            </button>

            <p className="rc-login-link">
              ¿Ya tienes cuenta?{" "}
              <Link to={loginHref} className="rc-link">
                Inicia sesión aquí
              </Link>
            </p>
          </form>

          <div className="rc-card-footer">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Tus datos están protegidos y cifrados</span>
          </div>
        </div>

        <aside className="rc-promo" aria-label="Beneficios de registrarte">
          <div className="rc-promo-inner">
            <div className="rc-promo-badge">
              <Plane size={14} aria-hidden="true" />
              Miembro exclusivo
            </div>
            <h3 className="rc-promo-title">Descubre el mundo con nosotros</h3>
            <p className="rc-promo-text">
              Accede a precios exclusivos, itinerarios personalizados y
              atención 24/7 para cada uno de tus viajes.
            </p>
            <div className="rc-promo-stats">
              <div className="rc-stat">
                <span className="rc-stat-num">+50</span>
                <span className="rc-stat-label">Destinos</span>
              </div>
              <div className="rc-stat-divider" />
              <div className="rc-stat">
                <span className="rc-stat-num">+2K</span>
                <span className="rc-stat-label">Viajeros</span>
              </div>
              <div className="rc-stat-divider" />
              <div className="rc-stat">
                <span className="rc-stat-num">4.9</span>
                <span className="rc-stat-label">Calificación</span>
              </div>
            </div>
            <div className="rc-promo-destinations">
              {DESTINATIONS.map((d) => (
                <span key={d.code} className="rc-dest-tag">
                  <span className="rc-dest-code">{d.code}</span>
                  {d.name}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <Link to="/" className="rc-home-link">
        ← Volver al inicio
      </Link>
    </div>
  );
}
