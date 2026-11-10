import type { ElementType, ReactNode } from "react";

export function InfoRow({
  label,
  value,
  variant,
}: {
  label: string;
  value?: string | number | null;
  variant?: "default" | "profit" | "muted";
}) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : String(value);

  const valueClass =
    variant === "profit"
      ? "adm-detail-field-value adm-detail-field-value--profit"
      : variant === "muted"
        ? "adm-detail-field-value adm-detail-field-value--muted"
        : "adm-detail-field-value";

  return (
    <div className="adm-detail-field">
      <p className="adm-detail-field-label">{label}</p>
      <p className={valueClass}>{display}</p>
    </div>
  );
}

export function SectionCard({
  icon: Icon,
  title,
  children,
  action,
  fullWidth,
}: {
  icon: ElementType;
  title: string;
  children: ReactNode;
  action?: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <section
      className={`adm-detail-section${fullWidth ? " adm-detail-section--full" : ""}`}
    >
      <div className="adm-detail-section-head">
        <div className="adm-detail-section-title-wrap">
          <span className="adm-detail-section-icon" aria-hidden="true">
            <Icon size={18} />
          </span>
          <h2 className="adm-detail-section-title">{title}</h2>
        </div>
        {action}
      </div>
      <div className="adm-detail-section-body">{children}</div>
    </section>
  );
}

const STATE_MAP: Record<string, { label: string; tone: string }> = {
  pending: { label: "Pendiente", tone: "pending" },
  confirmed: { label: "Confirmada", tone: "confirmed" },
  finished: { label: "Finalizada", tone: "finished" },
  canceled: { label: "Cancelada", tone: "canceled" },
  paid: { label: "Pagada", tone: "paid" },
  active: { label: "Activo", tone: "paid" },
  inactive: { label: "Inactivo", tone: "finished" },
};

export function StatusBadge({ state }: { state: string }) {
  const info = STATE_MAP[state] ?? {
    label: state,
    tone: "default",
  };

  return (
    <span
      className={`adm-res-status-badge adm-res-status-badge--${info.tone}`}
    >
      {info.label}
    </span>
  );
}
