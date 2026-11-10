import { useMemo, useState, type FormEvent } from "react";
import { passengerService } from "../../passengerService";
import type { Passenger, PassengerPayload, PassengerType } from "../../types/passenger";
import type { Reservation } from "../../types/reservation";
import { parsePassengerApiError } from "../../utils/passengerErrors";
import {
  PASSENGER_TYPE_LABELS,
  getAvailablePassengerTypes,
  getDefaultPassengerType,
  passengerProgress,
} from "../../utils/passengerProgress";

interface PassengerFormProps {
  reservation: Reservation;
  initial?: Passenger | null;
  onSuccess: () => void;
  onCancel: () => void;
  apiMode?: "client" | "admin";
}

function toInputDate(value?: string) {
  if (!value) return "";
  return value.split("T")[0];
}

function validateForm(
  payload: PassengerPayload,
  isEdit: boolean,
): string | null {
  if (!payload.name.trim()) return "El nombre es obligatorio.";
  if (payload.name.trim().length > 50) return "El nombre no puede exceder 50 caracteres.";
  if (!payload.last_name.trim()) return "El apellido es obligatorio.";
  if (payload.last_name.trim().length > 50) {
    return "El apellido no puede exceder 50 caracteres.";
  }
  if (!payload.birth_date) return "La fecha de nacimiento es obligatoria.";
  if (!payload.nationality.trim()) return "La nacionalidad es obligatoria.";
  if (payload.nationality.trim().length > 45) {
    return "La nacionalidad no puede exceder 45 caracteres.";
  }
  if (!payload.type) return "Selecciona el tipo de pasajero.";

  const birth = new Date(`${payload.birth_date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (birth >= today) {
    return "La fecha de nacimiento debe ser anterior a hoy.";
  }

  if (!isEdit && !["adult", "junior", "child"].includes(payload.type)) {
    return "Tipo de pasajero inválido.";
  }

  return null;
}

export default function PassengerForm({
  reservation,
  initial,
  onSuccess,
  onCancel,
  apiMode = "client",
}: PassengerFormProps) {
  const isEdit = Boolean(initial);
  const progress = passengerProgress(reservation);
  const availableTypes = useMemo(
    () =>
      isEdit && initial
        ? getAvailablePassengerTypes({
            ...reservation,
            passengers: (reservation.passengers ?? []).filter(
              (p) => p.id !== initial.id,
            ),
          }).concat(initial.type)
        : getAvailablePassengerTypes(reservation),
    [reservation, initial, isEdit],
  );

  const defaultType: PassengerType =
    initial?.type ??
    getDefaultPassengerType(reservation) ??
    availableTypes[0] ??
    "adult";

  const [name, setName] = useState(initial?.name ?? "");
  const [lastName, setLastName] = useState(initial?.last_name ?? "");
  const [birthDate, setBirthDate] = useState(toInputDate(initial?.birth_date));
  const [nationality, setNationality] = useState(initial?.nationality ?? "");
  const [type, setType] = useState<PassengerType>(defaultType);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: PassengerPayload = {
      name: name.trim(),
      last_name: lastName.trim(),
      birth_date: birthDate,
      nationality: nationality.trim(),
      type,
    };

    const validationError = validateForm(payload, isEdit);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isEdit && !availableTypes.includes(type)) {
      setError("Ya no hay cupos disponibles para ese tipo de pasajero.");
      return;
    }

    try {
      setSubmitting(true);

      if (isEdit && initial) {
        await passengerService.updatePassenger(
          reservation.id,
          initial.id,
          payload,
          apiMode,
        );
      } else {
        await passengerService.createPassenger(reservation.id, payload, apiMode);
      }

      onSuccess();
    } catch (err) {
      setError(parsePassengerApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const slotsHint = (
    <div className="pg-form-slots">
      {progress.adult.limit > 0 && (
        <span>
          Adultos: {progress.adult.registered}/{progress.adult.limit}
        </span>
      )}
      {progress.junior.limit > 0 && (
        <span>
          Juvenil: {progress.junior.registered}/{progress.junior.limit}
        </span>
      )}
      {progress.child.limit > 0 && (
        <span>
          Infantes: {progress.child.registered}/{progress.child.limit}
        </span>
      )}
    </div>
  );

  return (
    <form className="pg-form" onSubmit={handleSubmit}>
      <h3 className="pg-form-title">
        {isEdit ? "Editar pasajero" : "Agregar pasajero"}
      </h3>

      {!isEdit && slotsHint}

      {error && <div className="pg-alert pg-alert--error">{error}</div>}

      <div className="pg-form-grid">
        <label className="pg-field">
          <span>Nombre *</span>
          <input
            type="text"
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Ismael"
            required
          />
        </label>

        <label className="pg-field">
          <span>Apellido *</span>
          <input
            type="text"
            maxLength={50}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Ej. García"
            required
          />
        </label>

        <label className="pg-field">
          <span>Fecha de nacimiento *</span>
          <input
            type="date"
            value={birthDate}
            max={maxDate}
            onChange={(e) => setBirthDate(e.target.value)}
            required
          />
        </label>

        <label className="pg-field">
          <span>Nacionalidad *</span>
          <input
            type="text"
            maxLength={45}
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            placeholder="Ej. Mexicana"
            required
          />
        </label>

        <label className="pg-field pg-field--full">
          <span>Tipo de pasajero *</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as PassengerType)}
            disabled={isEdit}
          >
            {(["adult", "junior", "child"] as PassengerType[]).map((t) => {
              const disabled = !availableTypes.includes(t);
              const limit =
                t === "adult"
                  ? progress.adult
                  : t === "junior"
                    ? progress.junior
                    : progress.child;

              if (limit.limit === 0 && !isEdit) return null;

              return (
                <option key={t} value={t} disabled={disabled && !isEdit}>
                  {PASSENGER_TYPE_LABELS[t]}
                  {!isEdit &&
                    ` (${limit.registered}/${limit.limit} registrados)`}
                  {disabled && !isEdit ? " — cupo lleno" : ""}
                </option>
              );
            })}
          </select>
          {isEdit && (
            <small className="pg-field-hint">
              El tipo no se puede cambiar al editar.
            </small>
          )}
        </label>
      </div>

      <div className="pg-form-actions">
        <button
          type="button"
          className="pg-btn pg-btn--ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </button>
        <button type="submit" className="pg-btn pg-btn--primary" disabled={submitting}>
          {submitting
            ? "Guardando..."
            : isEdit
              ? "Guardar cambios"
              : "Registrar pasajero"}
        </button>
      </div>
    </form>
  );
}
