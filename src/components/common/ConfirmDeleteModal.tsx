import { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import "../../styles/ConfirmDeleteModal.css";

interface ConfirmDeleteModalProps {
  /** Si es null, el modal no se muestra */
  isOpen: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  footnote?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  title = "¿Eliminar elemento?",
  description = "Esta acción no se puede deshacer.",
  confirmLabel = "Sí, eliminar",
  cancelLabel = "Cancelar",
  loading = false,
  footnote = "Esta acción es permanente y no se puede deshacer.",
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="confirm-delete-backdrop"
      role="presentation"
      onClick={loading ? undefined : onCancel}
    >
      <div
        className="confirm-delete-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="confirm-delete-btn confirm-delete-btn--ghost"
          style={{
            position: "absolute",
            top: "0.85rem",
            right: "0.85rem",
            minHeight: "2rem",
            width: "2rem",
            padding: 0,
            borderRadius: "999px",
          }}
          onClick={onCancel}
          disabled={loading}
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>

        <div className="confirm-delete-icon-wrap" aria-hidden="true">
          <Trash2 size={22} strokeWidth={2.2} />
        </div>

        <p className="confirm-delete-kicker">Viajes Sueña · confirmación</p>
        <h3 id="confirm-delete-title" className="confirm-delete-title">
          {title}
        </h3>
        <p id="confirm-delete-desc" className="confirm-delete-desc">
          {description}
        </p>

        {footnote ? (
          <p className="confirm-delete-note">
            <AlertTriangle size={16} className="shrink-0 text-amber-600" />
            <span>{footnote}</span>
          </p>
        ) : null}

        <div className="confirm-delete-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="confirm-delete-btn confirm-delete-btn--ghost"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="confirm-delete-btn confirm-delete-btn--danger"
          >
            <Trash2 size={16} />
            {loading ? "Eliminando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}