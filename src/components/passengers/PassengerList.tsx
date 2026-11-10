import { Pencil, Trash2, UserRound } from "lucide-react";
import type { Passenger } from "../../types/passenger";
import { PASSENGER_TYPE_LABELS } from "../../utils/passengerProgress";

interface PassengerListProps {
  passengers: Passenger[];
  canEdit?: boolean;
  onEdit?: (passenger: Passenger) => void;
  onDelete?: (passenger: Passenger) => void;
  deletingId?: number | null;
}

function formatBirthDate(value: string) {
  const iso = value.split("T")[0];
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PassengerList({
  passengers,
  canEdit = false,
  onEdit,
  onDelete,
  deletingId,
}: PassengerListProps) {
  if (passengers.length === 0) {
    return (
      <div className="pg-list-empty">
        <UserRound size={28} aria-hidden="true" />
        <p>Aún no has registrado pasajeros para esta reserva.</p>
        <span>Puedes agregarlos ahora o completarlos más tarde.</span>
      </div>
    );
  }

  return (
    <ul className="pg-list">
      {passengers.map((passenger) => (
        <li key={passenger.id} className="pg-list-item">
          <div className="pg-list-avatar" aria-hidden="true">
            <UserRound size={18} />
          </div>
          <div className="pg-list-body">
            <span className="pg-list-name">
              {passenger.name} {passenger.last_name}
            </span>
            <span className="pg-list-meta">
              {PASSENGER_TYPE_LABELS[passenger.type]} ·{" "}
              {passenger.nationality} · Nac.{" "}
              {formatBirthDate(passenger.birth_date)}
            </span>
          </div>
          {canEdit && onEdit && onDelete && (
            <div className="pg-list-actions">
              <button
                type="button"
                className="pg-icon-btn"
                aria-label={`Editar ${passenger.name}`}
                onClick={() => onEdit(passenger)}
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                className="pg-icon-btn pg-icon-btn--danger"
                aria-label={`Eliminar ${passenger.name}`}
                disabled={deletingId === passenger.id}
                onClick={() => onDelete(passenger)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
