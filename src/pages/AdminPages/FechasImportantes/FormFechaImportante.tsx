import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import ClientSearchField, {
  type ClientOption,
} from "../../../components/Admin/importantDates/ClientSearchField";
import {
  getImportantDateErrorMessage,
  importantDateService,
} from "../../../importantDateService";
import type { ReminderPreset } from "../../../types/importantDate";
import {
  IMPORTANT_DATE_TYPE_OPTIONS,
  reminderPresetLabel,
} from "../../../utils/importantDateLabels";
import "../../../styles/AdminForm.css";
import "../../../styles/AdminImportantDates.css";
import { Save, ArrowLeft, CalendarRange, Loader2 } from "lucide-react";

const PRESET_OPTIONS = Object.entries(reminderPresetLabel) as [ReminderPreset, string][];

export default function FormFechaImportante() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [client, setClient] = useState<ClientOption | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState(
    searchParams.get("tipo") === "informativo" ? "informativo" : "birthday",
  );
  const [eventDate, setEventDate] = useState("");
  const [observation, setObservation] = useState("");
  const [reminderPreset, setReminderPreset] = useState<ReminderPreset>("one_day");
  const [reminderDays, setReminderDays] = useState("3");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (!isEdit || !id) return;
    importantDateService
      .get(Number(id))
      .then((data) => {
        setTitle(data.title);
        setType(data.type);
        setEventDate(data.event_date);
        setObservation(data.observation ?? "");
        setReminderPreset(data.reminder_preset);
        setReminderDays(String(data.reminder_days_before ?? 3));
        setReminderTime(data.reminder_time ?? "09:00");
        if (data.user) {
          setClient({
            id: data.user.id,
            name: data.user.name,
            last_name: data.user.last_name,
            email: data.user.email,
            state: "active",
          });
        }
      })
      .catch((err) =>
        setMessage({
          type: "error",
          text: getImportantDateErrorMessage(err, "No se pudo cargar la fecha."),
        }),
      )
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        user_id: isInformative ? null : client?.id ?? null,
        title: title.trim(),
        type: type.trim(),
        event_date: eventDate,
        observation: observation.trim() || undefined,
        reminder_preset: reminderPreset,
        reminder_days_before:
          reminderPreset === "custom" ? Number(reminderDays) : null,
        reminder_time: reminderPreset === "custom" ? reminderTime : null,
      };

      if (isEdit && id) {
        await importantDateService.update(Number(id), payload);
      } else {
        await importantDateService.create(payload);
      }
      navigate("/admin/fechas-importantes");
    } catch (err) {
      setMessage({
        type: "error",
        text: getImportantDateErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const isInformative = type === "informativo";

  useEffect(() => {
    if (isInformative && client) {
      setClient(null);
    }
  }, [isInformative, client]);

  const pageTitle = isEdit
    ? "Editar fecha importante"
    : isInformative
      ? "Nueva nota informativa"
      : "Nueva fecha importante";
  const submitLabel = saving
    ? "Guardando..."
    : isEdit
      ? "Guardar cambios"
      : "Registrar fecha";

  return (
    <AdminLayout>
      <div className="adm-form-page id-form-page">
        <header className="id-form-header">
          <Link to="/admin/fechas-importantes" className="id-form-back">
            <ArrowLeft size={16} aria-hidden="true" />
            Volver al listado
          </Link>
          <h1 className="id-form-title">{pageTitle}</h1>
          <p className="id-form-subtitle">
            {isInformative
              ? "Avisos internos de la agencia: se sincronizan en Google Calendar como los demás."
              : "Programa recordatorios para fechas especiales de tus clientes"}
          </p>
        </header>

        {message && (
          <div className={`id-form-banner id-form-banner--${message.type}`} role="alert">
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="id-form-loading">
            <Loader2 size={22} className="id-form-spinner" aria-hidden="true" />
            Cargando datos…
          </div>
        ) : (
          <form className="adm-form-card id-form-card" onSubmit={handleSubmit} noValidate>
            <div className="id-form-section">
              <h2 className="id-form-section-title">Datos de la fecha</h2>
              <div className="id-form-grid">
                {!isInformative && (
                  <ClientSearchField value={client} onChange={setClient} disabled={saving} />
                )}

                <div className="id-form-field">
                  <label className="id-form-label" htmlFor="id-type">
                    Tipo de fecha
                  </label>
                  <select
                    id="id-type"
                    className="id-form-control"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                    disabled={saving}
                  >
                    {IMPORTANT_DATE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {isInformative && (
                    <p className="id-form-hint">
                      Informativo es para la agencia: sin cliente, aparece en el filtro y en el calendario.
                    </p>
                  )}
                </div>

                <div className="id-form-field id-form-field--full">
                  <label className="id-form-label" htmlFor="id-title">
                    Nombre de la fecha importante
                  </label>
                  <input
                    id="id-title"
                    className="id-form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={255}
                    placeholder="Ej. Cumpleaños de María"
                    disabled={saving}
                  />
                </div>

                <div className="id-form-field id-form-field--date">
                  <label className="id-form-label" htmlFor="id-event-date">
                    Fecha importante
                  </label>
                  <input
                    id="id-event-date"
                    type="date"
                    className="id-form-control id-form-control--date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="id-form-field id-form-field--full">
                  <label className="id-form-label" htmlFor="id-observation">
                    Observación del día
                  </label>
                  <textarea
                    id="id-observation"
                    className="id-form-control id-form-control--textarea"
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    rows={5}
                    maxLength={2000}
                    placeholder="Qué recordar o qué acción realizar el día del evento…"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            <div className="id-form-section id-form-section--reminder">
              <h2 className="id-form-section-title">Recordatorio</h2>
              <p className="id-form-section-desc">
                Elige cuándo quieres recibir el aviso en Google Calendar.
              </p>

              <div className="id-reminder-grid" role="radiogroup" aria-label="Anticipación del recordatorio">
                {PRESET_OPTIONS.map(([value, label]) => (
                  <label
                    key={value}
                    className={`id-reminder-chip${
                      reminderPreset === value ? " id-reminder-chip--active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="reminder_preset"
                      value={value}
                      checked={reminderPreset === value}
                      onChange={() => setReminderPreset(value)}
                      disabled={saving}
                      className="id-reminder-radio"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              {reminderPreset === "custom" && (
                <div className="id-custom-reminder">
                  <div className="id-form-field">
                    <label className="id-form-label" htmlFor="id-reminder-days">
                      Días de anticipación
                    </label>
                    <input
                      id="id-reminder-days"
                      type="number"
                      min={0}
                      max={365}
                      className="id-form-control"
                      value={reminderDays}
                      onChange={(e) => setReminderDays(e.target.value)}
                      required
                      disabled={saving}
                    />
                  </div>
                  <div className="id-form-field">
                    <label className="id-form-label" htmlFor="id-reminder-time">
                      Hora de la notificación
                    </label>
                    <input
                      id="id-reminder-time"
                      type="time"
                      className="id-form-control id-form-control--time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      required
                      disabled={saving}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="id-recurrence-note">
              <CalendarRange size={20} className="id-recurrence-icon" aria-hidden="true" />
              <div>
                <strong>Repetición anual</strong>
                <p>
                  El evento se sincroniza en Google Calendar con recurrencia cada año. Los
                  cumpleaños del 29 de febrero siguen las reglas de años bisiestos de Google
                  Calendar.
                </p>
              </div>
            </div>

            <footer className="id-form-actions">
              <Link
                to="/admin/fechas-importantes"
                className="id-form-btn id-form-btn--secondary"
              >
                Cancelar
              </Link>
              <button type="submit" className="id-form-btn id-form-btn--primary" disabled={saving}>
                {saving ? (
                  <Loader2 size={16} className="id-form-spinner" aria-hidden="true" />
                ) : (
                  <Save size={16} aria-hidden="true" />
                )}
                {submitLabel}
              </button>
            </footer>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
