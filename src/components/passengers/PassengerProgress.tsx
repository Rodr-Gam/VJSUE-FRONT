import type { Reservation } from "../../types/reservation";
import {
  PASSENGER_TYPE_LABELS,
  passengerProgress,
} from "../../utils/passengerProgress";

interface PassengerProgressProps {
  reservation: Reservation;
  variant?: "full" | "compact";
}

export default function PassengerProgress({
  reservation,
  variant = "full",
}: PassengerProgressProps) {
  const progress = passengerProgress(reservation);
  const rows = [
    { key: "adult" as const, data: progress.adult },
    { key: "junior" as const, data: progress.junior },
    { key: "child" as const, data: progress.child },
  ].filter((row) => row.data.limit > 0);

  if (variant === "compact") {
    return (
      <div className="pg-progress-compact">
        <span className="pg-progress-compact-label">Datos de pasajeros</span>
        <span
          className={`pg-progress-compact-value${progress.isComplete ? " pg-progress-compact-value--done" : ""}`}
        >
          {progress.totalRegistered}/{progress.totalRequired} registrados
        </span>
      </div>
    );
  }

  return (
    <div className="pg-progress">
      <div className="pg-progress-header">
        <span className="pg-progress-title">Progreso de pasajeros</span>
        <span
          className={`pg-progress-total${progress.isComplete ? " pg-progress-total--done" : ""}`}
        >
          {progress.totalRegistered}/{progress.totalRequired} total
        </span>
      </div>

      <div className="pg-progress-rows">
        {rows.map(({ key, data }) => {
          const pct =
            data.limit > 0
              ? Math.min(100, (data.registered / data.limit) * 100)
              : 0;
          const done = data.registered >= data.limit;

          return (
            <div key={key} className="pg-progress-row">
              <div className="pg-progress-row-head">
                <span className="pg-progress-type">
                  {PASSENGER_TYPE_LABELS[key]}
                </span>
                <span
                  className={`pg-progress-count${done ? " pg-progress-count--done" : ""}`}
                >
                  {data.registered}/{data.limit}
                </span>
              </div>
              <div className="pg-progress-bar">
                <div
                  className={`pg-progress-fill${done ? " pg-progress-fill--done" : ""}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
