import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { api } from "../../api";
import {
  User,
  Mail,
  Phone,
  Lock,
  Edit3,
  X,
  Save,
  Loader2,
  ShieldCheck,
  Tag,
  ChevronDown,
  Package,
  type LucideIcon,
} from "lucide-react";

/**
 * PerfilUsuario
 * ---------------------------------------------------------------------------
 * Componente reutilizable de "mi perfil": funciona tanto para admins como
 * para clientes, porque ambos apuntan al mismo endpoint autenticado
 * (GET/PUT /perfil), que en el backend resuelve el usuario con
 * `$request->user()`. No recibe ni necesita un `id`.
 *
 * Usa la instancia `api` (axios) del proyecto, que ya maneja el token
 * (interceptor + localStorage) y el logout automático en 401.
 *
 * Uso:
 *   <PerfilUsuario />
 * ---------------------------------------------------------------------------
 */

type EstadoKey = "active" | "inactive" | "banned";
type Tone = "teal" | "amber" | "rose" | "slate";

interface EstadoInfo {
  label: string;
  tone: Tone;
}

const ESTADOS: Record<EstadoKey, EstadoInfo> = {
  active: { label: "Activo", tone: "teal" },
  inactive: { label: "Inactivo", tone: "amber" },
  banned: { label: "Suspendido", tone: "rose" },
};

const toneClasses: Record<Tone, string> = {
  teal: "bg-teal-50 text-teal-800 border-teal-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  rose: "bg-rose-50 text-rose-800 border-rose-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

interface ChipProps {
  children: ReactNode;
  tone?: Tone;
}

function Chip({ children, tone = "slate" }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

interface FieldProps {
  label: string;
  icon?: LucideIcon;
  error?: string;
  children: ReactNode;
}

function Field({ label, icon: Icon, error, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        {Icon && <Icon size={13} strokeWidth={2} />}
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

interface Rol {
  name: string;
}

interface PaqueteRef {
  id: number;
}

interface Usuario {
  id: number;
  name: string;
  last_name: string;
  email: string;
  phone: string;
  state?: EstadoKey;
  role?: Rol | string;
  role_id?: number;
  packages?: PaqueteRef[];
}

function unwrapPerfilUser(payload: unknown): Usuario | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  if (record.user && typeof record.user === "object") {
    return record.user as Usuario;
  }
  if (record.data && typeof record.data === "object") {
    return record.data as Usuario;
  }
  if (typeof record.id === "number" && typeof record.email === "string") {
    return record as Usuario;
  }

  return null;
}

function readStoredUser(): Usuario | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return unwrapPerfilUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

interface FormState {
  name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface PasswordFormState {
  phone_last4: string;
  password: string;
  password_confirmation: string;
}

type Errores = Record<string, string[] | undefined>;

interface Aviso {
  tipo: "ok" | "error" | "demo";
  texto: string;
}

interface PerfilUsuarioProps {
  variant?: "default" | "cliente" | "admin";
}

export default function PerfilUsuario({ variant = "default" }: PerfilUsuarioProps) {
  const isBrandedView = variant === "cliente" || variant === "admin";
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", last_name: "", email: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    phone_last4: "",
    password: "",
    password_confirmation: "",
  });
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [editando, setEditando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const cargarPerfil = useCallback(async () => {
    setCargando(true);
    setAviso(null);
    try {
      const res = await api.get("/perfil");
      const data = unwrapPerfilUser(res.data);
      if (!data) {
        throw new Error("Respuesta de perfil inválida");
      }
      setUsuario(data);
      setForm({
        name: data.name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
      });
    } catch (error) {
      console.error("Error al cargar el perfil:", error);
      const fallback = readStoredUser();
      if (fallback) {
        setUsuario(fallback);
        setForm({
          name: fallback.name || "",
          last_name: fallback.last_name || "",
          email: fallback.email || "",
          phone: fallback.phone || "",
        });
        setAviso({
          tipo: "demo",
          texto: "Mostrando datos guardados en sesión. Recarga la página o vuelve a iniciar sesión si falta información.",
        });
      } else {
        setAviso({ tipo: "error", texto: "No se pudo cargar el perfil." });
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  const cancelarEdicion = () => {
    if (usuario) {
      setForm({
        name: usuario.name || "",
        last_name: usuario.last_name || "",
        email: usuario.email || "",
        phone: usuario.phone || "",
      });
    }
    setPasswordForm({ phone_last4: "", password: "", password_confirmation: "" });
    setMostrarPassword(false);
    setErrores({});
    setEditando(false);
  };

  const guardar = async () => {
    setErrores({});

    if (mostrarPassword && passwordForm.password) {
      if (!passwordForm.phone_last4.trim()) {
        setErrores({ phone_last4: ["Ingresa los últimos 4 dígitos de tu teléfono."] });
        return;
      }
      if (!/^\d{4}$/.test(passwordForm.phone_last4)) {
        setErrores({ phone_last4: ["Deben ser exactamente 4 números."] });
        return;
      }
      if (passwordForm.password.length < 8) {
        setErrores({ password: ["La contraseña debe tener al menos 8 caracteres."] });
        return;
      }
      if (passwordForm.password !== passwordForm.password_confirmation) {
        setErrores({ password_confirmation: ["Las contraseñas no coinciden."] });
        return;
      }
    }

    setGuardando(true);
    setAviso(null);

    const body: FormState & {
      phone_last4?: string;
      password?: string;
      password_confirmation?: string;
    } = { ...form };
    if (mostrarPassword && passwordForm.password) {
      body.phone_last4 = passwordForm.phone_last4;
      body.password = passwordForm.password;
      body.password_confirmation = passwordForm.password_confirmation;
    }

    try {
      const res = await api.put("/perfil", body);
      const data = res.data;
      const updatedUser = unwrapPerfilUser(data.user ?? data);

      if (updatedUser) {
        setUsuario(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      setPasswordForm({ phone_last4: "", password: "", password_confirmation: "" });
      setMostrarPassword(false);
      setEditando(false);
      setAviso({ tipo: "ok", texto: data.message || "Perfil actualizado con éxito." });
    } catch (error: any) {
      const errors = error.response?.data?.errors;
      const message = error.response?.data?.message;
      setErrores(errors || {});
      setAviso({
        tipo: "error",
        texto: message || "No se pudo actualizar el perfil.",
      });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className={isBrandedView ? "pf-loading" : "flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-slate-500"}>
        <Loader2 size={18} className={isBrandedView ? "pf-spin" : "animate-spin"} />
        <span className={isBrandedView ? undefined : "text-sm"}>Cargando perfil…</span>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className={isBrandedView ? "pf-empty" : "rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500"}>
        <span>No se pudo cargar tu perfil.</span>
        {aviso && (
          <span className={isBrandedView ? "pf-field-error" : "mt-2 text-rose-600"}>
            {aviso.texto}
          </span>
        )}
      </div>
    );
  }

  const estado = usuario.state ? ESTADOS[usuario.state] : null;
  const roleName =
    typeof usuario.role === "string"
      ? usuario.role
      : usuario.role?.name || (usuario.role_id === 1 ? "admin" : "cliente");
  const rol = roleName.toLowerCase().includes("admin") ? "admin" : "cliente";
  const iniciales = `${(usuario.name?.[0] || "").toUpperCase()}${(usuario.last_name?.[0] || "").toUpperCase()}`;

  if (isBrandedView) {
    return (
      <div className="pf-profile">
        {aviso && (
          <div
            className={`pf-alert ${
              aviso.tipo === "ok"
                ? "pf-alert--ok"
                : aviso.tipo === "demo"
                ? "pf-alert--demo"
                : "pf-alert--error"
            }`}
          >
            {aviso.texto}
          </div>
        )}

        <div className="pf-card">
          <div className="pf-card-hero">
            <div className="pf-card-top">
              <span className="pf-card-label">
                {variant === "admin" ? "Perfil de administrador" : "Perfil de viajero"}
              </span>
              <span className="pf-card-id">#{String(usuario.id).padStart(6, "0")}</span>
            </div>

            <div className="pf-user-row">
              <div className="pf-avatar">{iniciales || <User size={18} />}</div>
              <div className="pf-user-info">
                <p className="pf-user-name">
                  {usuario.name} {usuario.last_name}
                </p>
                <p className="pf-user-email">{usuario.email}</p>
              </div>
            </div>

            <div className="pf-chips">
              <span className="pf-chip pf-chip--gold">
                <ShieldCheck size={12} /> {rol === "admin" ? "Administrador" : "Cliente"}
              </span>
              {estado && <span className="pf-chip">{estado.label}</span>}
              {rol === "cliente" && Array.isArray(usuario.packages) && (
                <span className="pf-chip">
                  <Package size={12} /> {usuario.packages.length} paquete(s)
                </span>
              )}
            </div>
          </div>

          <div className="pf-perforation" />

          <div className="pf-body">
            <div className="pf-section-head">
              <h2 className="pf-section-title">Datos personales</h2>
              <div className="pf-actions">
                {!editando ? (
                  <button type="button" onClick={() => setEditando(true)} className="pf-btn pf-btn--ghost">
                    <Edit3 size={14} /> Editar
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={cancelarEdicion}
                      disabled={guardando}
                      className="pf-btn pf-btn--ghost"
                    >
                      <X size={14} /> Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={guardar}
                      disabled={guardando}
                      className="pf-btn pf-btn--primary"
                    >
                      {guardando ? <Loader2 size={14} className="pf-spin" /> : <Save size={14} />}
                      Guardar
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="pf-grid">
              <label className="pf-field">
                <span className="pf-field-label">
                  <User size={13} /> Nombre
                </span>
                <input
                  className="pf-input"
                  value={form.name}
                  disabled={!editando}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {errores.name?.[0] && <span className="pf-field-error">{errores.name[0]}</span>}
              </label>
              <label className="pf-field">
                <span className="pf-field-label">
                  <User size={13} /> Apellido
                </span>
                <input
                  className="pf-input"
                  value={form.last_name}
                  disabled={!editando}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
                {errores.last_name?.[0] && (
                  <span className="pf-field-error">{errores.last_name[0]}</span>
                )}
              </label>
              <label className="pf-field">
                <span className="pf-field-label">
                  <Mail size={13} /> Correo electrónico
                </span>
                <input
                  type="email"
                  className="pf-input"
                  value={form.email}
                  disabled={!editando}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {errores.email?.[0] && <span className="pf-field-error">{errores.email[0]}</span>}
              </label>
              <label className="pf-field">
                <span className="pf-field-label">
                  <Phone size={13} /> Teléfono
                </span>
                <input
                  className="pf-input"
                  value={form.phone}
                  disabled={!editando}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                {errores.phone?.[0] && <span className="pf-field-error">{errores.phone[0]}</span>}
              </label>
            </div>

            {editando && (
              <div>
                <button
                  type="button"
                  onClick={() => setMostrarPassword((v) => !v)}
                  className="pf-password-toggle"
                >
                  <span>
                    <Lock size={14} /> Cambiar contraseña
                  </span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: mostrarPassword ? "rotate(180deg)" : undefined,
                      transition: "transform 0.2s",
                      opacity: 0.5,
                    }}
                  />
                </button>

                {mostrarPassword && (
                  <div className="pf-grid">
                    <label className="pf-field pf-field--full">
                      <span className="pf-field-label">
                        <Phone size={13} /> Últimos 4 dígitos de tu teléfono
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        className="pf-input"
                        value={passwordForm.phone_last4}
                        placeholder="Ej. 7295"
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            phone_last4: e.target.value.replace(/\D/g, "").slice(0, 4),
                          })
                        }
                      />
                      {errores.phone_last4?.[0] && (
                        <span className="pf-field-error">{errores.phone_last4[0]}</span>
                      )}
                    </label>
                    <label className="pf-field">
                      <span className="pf-field-label">
                        <Lock size={13} /> Nueva contraseña
                      </span>
                      <input
                        type="password"
                        className="pf-input"
                        value={passwordForm.password}
                        placeholder="Mínimo 8 caracteres"
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, password: e.target.value })
                        }
                      />
                      {errores.password?.[0] && (
                        <span className="pf-field-error">{errores.password[0]}</span>
                      )}
                    </label>
                    <label className="pf-field">
                      <span className="pf-field-label">
                        <Lock size={13} /> Confirmar contraseña
                      </span>
                      <input
                        type="password"
                        className="pf-input"
                        value={passwordForm.password_confirmation}
                        placeholder="Repite la contraseña"
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            password_confirmation: e.target.value,
                          })
                        }
                      />
                      {errores.password_confirmation?.[0] && (
                        <span className="pf-field-error">{errores.password_confirmation[0]}</span>
                      )}
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl font-sans">
      {aviso && (
        <div
          className={`mb-4 rounded-lg border px-3.5 py-2.5 text-sm ${
            aviso.tipo === "ok"
              ? "border-teal-200 bg-teal-50 text-teal-800"
              : aviso.tipo === "demo"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {aviso.texto}
        </div>
      )}

      {/* Tarjeta estilo "pase de abordar" */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Cabecera / talón del boleto */}
        <div className="bg-teal-800 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal-200">
              Perfil de viajero
            </span>
            <span className="font-mono text-[11px] tracking-widest text-teal-200">
              #{String(usuario.id).padStart(6, "0")}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-700 font-serif text-base text-teal-50 ring-1 ring-inset ring-teal-600">
              {iniciales || <User size={18} />}
            </div>
            <div className="min-w-0">
              <p className="truncate font-serif text-xl leading-tight">
                {usuario.name} {usuario.last_name}
              </p>
              <p className="truncate text-sm text-teal-200">{usuario.email}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Chip tone="slate">
              <ShieldCheck size={12} /> {rol === "admin" ? "Administrador" : "Cliente"}
            </Chip>
            {estado && <Chip tone={estado.tone}>{estado.label}</Chip>}
            {rol === "cliente" && Array.isArray(usuario.packages) && (
              <Chip tone="slate">
                <Package size={12} /> {usuario.packages.length} paquete(s)
              </Chip>
            )}
          </div>
        </div>

        {/* Línea perforada, estilo talón de boleto */}
        <div className="relative border-t border-dashed border-slate-300">
          <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-slate-100" />
          <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-slate-100" />
        </div>

        {/* Cuerpo: formulario */}
        <div className="px-6 py-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-lg text-slate-900">Datos personales</h2>
            {!editando ? (
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Edit3 size={14} /> Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelarEdicion}
                  disabled={guardando}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <X size={14} /> Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={guardando}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-teal-800 disabled:opacity-60"
                >
                  {guardando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Guardar
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre" icon={User} error={errores.name?.[0]}>
              <input
                className={inputBase}
                value={form.name}
                disabled={!editando}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Apellido" icon={User} error={errores.last_name?.[0]}>
              <input
                className={inputBase}
                value={form.last_name}
                disabled={!editando}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </Field>
            <Field label="Correo electrónico" icon={Mail} error={errores.email?.[0]}>
              <input
                type="email"
                className={inputBase}
                value={form.email}
                disabled={!editando}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Teléfono" icon={Phone} error={errores.phone?.[0]}>
              <input
                className={inputBase}
                value={form.phone}
                disabled={!editando}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
          </div>

          {/* Rol y estado: solo lectura, gestionados por administración */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Rol" icon={Tag}>
              <input className={inputBase} value={rol === "admin" ? "Administrador" : "Cliente"} disabled />
            </Field>
            {estado && (
              <Field label="Estado de la cuenta" icon={ShieldCheck}>
                <input className={inputBase} value={estado.label} disabled />
              </Field>
            )}
          </div>

          {/* Cambiar contraseña — solo visible en modo edición */}
          {editando && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setMostrarPassword((v) => !v)}
                className="flex w-full items-center justify-between text-sm font-medium text-slate-700"
              >
                <span className="flex items-center gap-1.5">
                  <Lock size={14} /> Cambiar contraseña
                </span>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform ${mostrarPassword ? "rotate-180" : ""}`}
                />
              </button>

              {mostrarPassword && (
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Últimos 4 dígitos de tu teléfono"
                    icon={Phone}
                    error={errores.phone_last4?.[0]}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      className={inputBase}
                      value={passwordForm.phone_last4}
                      placeholder="Ej. 7295"
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          phone_last4: e.target.value.replace(/\D/g, "").slice(0, 4),
                        })
                      }
                    />
                  </Field>
                  <Field label="Nueva contraseña" icon={Lock} error={errores.password?.[0]}>
                    <input
                      type="password"
                      className={inputBase}
                      value={passwordForm.password}
                      placeholder="Mínimo 8 caracteres"
                      onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    />
                  </Field>
                  <Field label="Confirmar contraseña" icon={Lock} error={errores.password_confirmation?.[0]}>
                    <input
                      type="password"
                      className={inputBase}
                      value={passwordForm.password_confirmation}
                      placeholder="Repite la contraseña"
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })
                      }
                    />
                  </Field>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
