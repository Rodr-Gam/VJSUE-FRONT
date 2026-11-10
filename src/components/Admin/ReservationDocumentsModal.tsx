import { X } from "lucide-react";
import ReservationDocuments, {
  type ReservationDocumentItem,
} from "./ReservationDocuments";
import "../../styles/AdminFinance.css";

interface ReservationDocumentsModalProps {
  reservationId: number;
  reservationLabel?: string;
  onClose: () => void;
  onDocumentsChange?: (documents: ReservationDocumentItem[]) => void;
}

export default function ReservationDocumentsModal({
  reservationId,
  reservationLabel,
  onClose,
  onDocumentsChange,
}: ReservationDocumentsModalProps) {
  return (
    <div
      className="adm-finance-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="adm-finance-modal adm-finance-modal--wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="res-docs-modal-title"
      >
        <div className="adm-res-docs-modal-head">
          <div>
            <h3 id="res-docs-modal-title" className="adm-finance-modal-title">
              Documentos PDF
            </h3>
            {reservationLabel && (
              <p className="adm-cell-muted adm-res-docs-modal-sub">
                Reserva #{reservationId} · {reservationLabel}
              </p>
            )}
          </div>
          <button
            type="button"
            className="adm-res-docs-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <p className="adm-res-docs-modal-hint">
          Sube un PDF por tipo: pago, cupón de hotel, traslado u otros (máx. 10
          MB).
        </p>

        <ReservationDocuments
          reservationId={reservationId}
          embedded
          hideTitle
          onDocumentsChange={onDocumentsChange}
        />
      </div>
    </div>
  );
}
