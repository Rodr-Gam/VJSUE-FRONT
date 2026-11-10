import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { api, setAuth } from "../../api";
import { getUserRole } from "../../utils/userRole";
import { parseApiValidationErrors } from "../../utils/apiHelpers";
import "../../styles/login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [smsStep, setSmsStep] = useState<"phone" | "code">("phone");
  const [smsName, setSmsName] = useState("");
  const [smsEmail, setSmsEmail] = useState("");
  const [smsPhone, setSmsPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsMessage, setSmsMessage] = useState<{
    texto: string;
    tipo: "success" | "error";
    devCode?: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const bgImageRef = useRef<HTMLImageElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const fromReservation = redirectTo?.startsWith("/cliente/reservar");

  // Efecto Parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
      const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
      if (bgImageRef.current) {
        bgImageRef.current.style.transform = `scale(1.1) translate(${moveX}px, ${moveY}px)`;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.closest(".form-group")?.classList.add("focused");
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.closest(".form-group")?.classList.remove("focused");
  };

  const completeLogin = (token: string, user: Record<string, unknown>) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setAuth(token);

    const role = getUserRole(user);

    if (role === "admin") {
      navigate("/admin/crear-paquete");
    } else if (redirectTo && redirectTo.startsWith("/cliente")) {
      navigate(redirectTo);
    } else {
      navigate("/cliente/dashboard");
    }
  };

  // Envío del Formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const response = await api.post("/login", {
        email: email,
        password: password,
      });

      const { token, user } = response.data;
      completeLogin(token, user);
    } catch (error: any) {
      if (error.response && error.response.data) {
        setErrorMessage(
          error.response.data.message || "Credenciales incorrectas",
        );
      } else {
        setErrorMessage(
          "No hay conexión con el backend. ¿Prendiste el servidor de Laravel, bro?",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const resetSmsFlow = () => {
    setShowForgot(false);
    setSmsStep("phone");
    setSmsName("");
    setSmsEmail("");
    setSmsPhone("");
    setSmsCode("");
    setSmsMessage(null);
  };

  const handleSmsSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmsMessage(null);
    setSmsLoading(true);

    try {
      const response = await api.post<{
        message: string;
        dev_hint?: string;
        dev_code?: string;
      }>("/otp/send", {
        name: smsName.trim(),
        email: smsEmail.trim(),
        phone: smsPhone.trim(),
      });

      const texto = response.data.dev_hint
        ? `${response.data.message} ${response.data.dev_hint}`
        : response.data.message;

      setSmsMessage({
        texto,
        tipo: "success",
        devCode: response.data.dev_code,
      });
      setSmsStep("code");
    } catch (error: unknown) {
      setSmsMessage({
        texto: parseApiValidationErrors(
          error,
          "No pudimos enviar el código. Verifica tus datos.",
        ),
        tipo: "error",
      });
    } finally {
      setSmsLoading(false);
    }
  };

  const handleSmsVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmsMessage(null);
    setSmsLoading(true);

    try {
      const response = await api.post("/otp/verify", {
        phone: smsPhone.trim(),
        code: smsCode.trim(),
      });

      const { token, user } = response.data;
      completeLogin(token, user);
    } catch (error: unknown) {
      setSmsMessage({
        texto: parseApiValidationErrors(error, "Codigo invalido o expirado."),
        tipo: "error",
      });
    } finally {
      setSmsLoading(false);
    }
  };

  return (
    <>
      <div className="bg-layer">
        <div className="bg-overlay" />
        <img
          ref={bgImageRef}
          className="bg-image"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBv5lCHwwc8oLrOimSLbWYj9y9LEoRwH1H1oPyMqYD0J2XmIsiVQP0C1NKQYLU5DMJt-El-5V9L-GGNu5XNM7Dshk-fgM4QzKGWmNFkzmxmuFnvNpdcA7waMdwljpJ0ML3ige3hakbo3rEdbYoKEv7Eg6Q18pqN6SeEWc-ESxc0rA7VbgV3P3lIRHj7FVbdterhOV8jaeShGLI9xtQn6itwdwjF0C9R0kwep9Ew4_kFIb5JU_axc-WG-s0QdXBQDEG4XEqzo9JYhsWd"
          alt="Luxury private aircraft on wet tarmac at twilight"
        />
      </div>

      <div className="vertical-text-wrapper">
        <span className="vertical-text">EXPLORE</span>
      </div>

      <main className="main-layout">
        <div className="form-card-wrapper">
          <div className="custom-border">
            <div className="glass-panel">
              <div className="brand-section">
                <h1 className="brand-title">Viajes Sueña</h1>
                <p className="brand-subtitle">Portal de Miembros</p>
              </div>

              {fromReservation && !errorMessage && (
                <div
                  style={{
                    color: "#d3a762",
                    backgroundColor: "rgba(211,167,98,0.1)",
                    padding: "12px",
                    borderRadius: "6px",
                    marginBottom: "20px",
                    textAlign: "center",
                    fontSize: "14px",
                    border: "1px solid rgba(211,167,98,0.25)",
                  }}
                >
                  Inicia sesión o crea una cuenta para continuar con tu reserva.
                </div>
              )}

              {errorMessage && (
                <div
                  style={{
                    color: "#ff6b6b",
                    backgroundColor: "rgba(255,107,107,0.1)",
                    padding: "12px",
                    borderRadius: "6px",
                    marginBottom: "20px",
                    textAlign: "center",
                    fontSize: "14px",
                    border: "1px solid rgba(255,107,107,0.2)",
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {showForgot ? (
                <>
                  <p className="brand-subtitle" style={{ marginBottom: "1rem" }}>
                    {smsStep === "phone" ? "Entrar con código SMS" : "Ingresa tu código"}
                  </p>

                  {smsMessage && (
                    <div
                      style={{
                        color:
                          smsMessage.tipo === "success" ? "#047857" : "#ff6b6b",
                        backgroundColor:
                          smsMessage.tipo === "success"
                            ? "rgba(4,120,87,0.1)"
                            : "rgba(255,107,107,0.1)",
                        padding: "12px",
                        borderRadius: "6px",
                        marginBottom: "20px",
                        textAlign: "center",
                        fontSize: "14px",
                        border:
                          smsMessage.tipo === "success"
                            ? "1px solid rgba(4,120,87,0.25)"
                            : "1px solid rgba(255,107,107,0.2)",
                      }}
                    >
                      {smsMessage.texto}
                      {smsMessage.devCode && (
                        <strong style={{ display: "block", marginTop: "8px", fontSize: "20px" }}>
                          Código: {smsMessage.devCode}
                        </strong>
                      )}
                    </div>
                  )}

                  {smsStep === "phone" ? (
                    <form className="login-form" onSubmit={handleSmsSend}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="sms-name">
                          Nombre
                        </label>
                        <div className="input-wrapper">
                          <span className="input-icon">person</span>
                          <input
                            className="form-input"
                            id="sms-name"
                            type="text"
                            placeholder="Como aparece en tu cuenta"
                            required
                            value={smsName}
                            onChange={(e) => setSmsName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="sms-email">
                          Correo registrado
                        </label>
                        <div className="input-wrapper">
                          <span className="input-icon">mail</span>
                          <input
                            className="form-input"
                            id="sms-email"
                            type="email"
                            placeholder="usuario@viajes.com"
                            required
                            value={smsEmail}
                            onChange={(e) => setSmsEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="sms-phone">
                          Teléfono registrado
                        </label>
                        <div className="input-wrapper">
                          <span className="input-icon">phone</span>
                          <input
                            className="form-input"
                            id="sms-phone"
                            type="tel"
                            placeholder="3312345678"
                            required
                            value={smsPhone}
                            onChange={(e) => setSmsPhone(e.target.value)}
                          />
                        </div>
                        <p style={{ fontSize: "12px", color: "#888", marginTop: "6px" }}>
                          Deben coincidir con los datos de tu perfil en la agencia.
                        </p>
                      </div>

                      <button
                        className="submit-btn"
                        type="submit"
                        disabled={smsLoading}
                      >
                        {smsLoading ? "Enviando..." : "Enviar código"}
                      </button>

                      <button
                        type="button"
                        className="forgot-link"
                        style={{
                          display: "block",
                          margin: "1rem auto 0",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                        onClick={resetSmsFlow}
                      >
                        Volver al inicio de sesión
                      </button>
                    </form>
                  ) : (
                    <form className="login-form" onSubmit={handleSmsVerify}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="sms-code">
                          Código de 6 dígitos
                        </label>
                        <div className="input-wrapper">
                          <span className="input-icon">pin</span>
                          <input
                            className="form-input"
                            id="sms-code"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]{6}"
                            maxLength={6}
                            placeholder="123456"
                            required
                            value={smsCode}
                            onChange={(e) =>
                              setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                            }
                          />
                        </div>
                      </div>

                      <button
                        className="submit-btn"
                        type="submit"
                        disabled={smsLoading || smsCode.length !== 6}
                      >
                        {smsLoading ? "Verificando..." : "Entrar"}
                      </button>

                      <button
                        type="button"
                        className="forgot-link"
                        style={{
                          display: "block",
                          margin: "1rem auto 0",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setSmsStep("phone");
                          setSmsCode("");
                          setSmsMessage(null);
                        }}
                      >
                        Enviar otro código
                      </button>

                      <button
                        type="button"
                        className="forgot-link"
                        style={{
                          display: "block",
                          margin: "0.5rem auto 0",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                        onClick={resetSmsFlow}
                      >
                        Volver al inicio de sesión
                      </button>
                    </form>
                  )}
                </>
              ) : (
              <form className="login-form" onSubmit={handleSubmit}>
                {/* Email */}
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Correo
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">mail</span>
                    <input
                      className="form-input"
                      id="email"
                      type="email"
                      placeholder="usuario@viajes.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="form-label" htmlFor="password">
                    Contraseña
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">lock</span>
                    <input
                      className="form-input"
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                    <button
                      className="toggle-password-btn"
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <label className="checkbox-label">
                    <div className="checkbox-box">
                      <input
                        className="checkbox-input"
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      <span className="checkbox-check">check</span>
                    </div>
                    <span className="checkbox-text">Recordarme</span>
                  </label>
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => {
                      setShowForgot(true);
                      setSmsStep("phone");
                      setSmsName("");
                      setSmsEmail(email);
                      setSmsPhone("");
                      setSmsCode("");
                      setSmsMessage(null);
                      setErrorMessage(null);
                    }}
                  >
                    Entrar con código SMS
                  </button>
                </div>

                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading ? "Iniciando Sesión..." : "Iniciar Sesión"}
                </button>
              </form>
              )}

              <div className="aux-actions">
                <p className="aux-text">
                  ¿Aún no tienes una cuenta?{" "}
                  {/* 🚀 CORREGIDO: Cambiado de <a> a <Link> apuntando a tu nueva vista */}
                  <Link
                    className="aux-link"
                    to={
                      redirectTo
                        ? `/register?redirect=${encodeURIComponent(redirectTo)}`
                        : "/register"
                    }
                  >
                    regístrate
                  </Link>
                </p>
                <div className="aux-icons">
                  <button className="icon-btn" aria-label="Idioma">
                    <span className="material-symbols-outlined">language</span>
                  </button>
                  <button className="icon-btn" aria-label="Ayuda">
                    <span className="material-symbols-outlined">
                      help_outline
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="visual-anchor">
          <div className="anchor-content">
            <div className="anchor-rule" />
            <h2 className="anchor-title">El horizonte le espera</h2>
            <p className="anchor-body">
              Experiencias curadas para el viajero más exigente del mundo.
            </p>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <p className="landing-footer-text">
          © 2026 Viajes Sueña Private Concierge
        </p>
      </footer>
    </>
  );
}
