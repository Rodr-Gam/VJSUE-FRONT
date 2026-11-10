import type { ImportantDate } from "../../../types/importantDate";
import { clientDisplayName } from "../../../utils/importantDateLabels";

interface MonthCalendarProps {
  year: number;
  month: number;
  items: ImportantDate[];
  onPrev: () => void;
  onNext: () => void;
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function startWeekdayMonday(year: number, month: number): number {
  const js = new Date(year, month - 1, 1).getDay();
  return js === 0 ? 6 : js - 1;
}

export default function MonthCalendar({
  year,
  month,
  items,
  onPrev,
  onNext,
}: MonthCalendarProps) {
  const totalDays = daysInMonth(year, month);
  const startPad = startWeekdayMonday(year, month);
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  const byDay = new Map<number, ImportantDate[]>();
  for (const item of items) {
    const day = new Date(item.event_date + "T12:00:00").getDate();
    const list = byDay.get(day) ?? [];
    list.push(item);
    byDay.set(day, list);
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="id-calendar">
      <div className="id-calendar-head">
        <button type="button" className="id-calendar-nav" onClick={onPrev} aria-label="Mes anterior">
          ‹
        </button>
        <h3 className="id-calendar-title">{monthLabel}</h3>
        <button type="button" className="id-calendar-nav" onClick={onNext} aria-label="Mes siguiente">
          ›
        </button>
      </div>
      <div className="id-calendar-weekdays">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="id-calendar-grid">
        {cells.map((day, idx) => (
          <div
            key={`${day ?? "e"}-${idx}`}
            className={`id-calendar-cell${day ? "" : " id-calendar-cell--empty"}`}
          >
            {day != null && <span className="id-calendar-day">{day}</span>}
            {day != null &&
              (byDay.get(day) ?? []).map((ev) => (
                <span key={ev.id} className="id-calendar-event" title={ev.title}>
                  {ev.title}
                  <small>{clientDisplayName(ev.user, { type: ev.type })}</small>
                </span>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
