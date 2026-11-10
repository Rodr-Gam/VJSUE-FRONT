import { useCallback, useEffect, useState } from "react";
import type { PaymentReceipt, PaymentReceiptStatus } from "../../../types/paymentReceipt";
import {
  getPaymentReceiptErrorMessage,
  paymentReceiptService,
} from "../../../paymentReceiptService";
import { formatMXN } from "../../../utils/reservationPricing";
import { formatAdminDate } from "../../../utils/adminFormat";
import SecuredFilePreview from "../../secured/SecuredFilePreview";
import SecuredFileLink from "../../secured/SecuredFileLink";
import { FileText, Trash2 } from "lucide-react";

const STATUS_LABELS: Record<PaymentReceiptStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

interface AdminPaymentReceiptsPanelProps {
  reservationId: number;
}

export default function AdminPaymentReceiptsPanel({
  reservationId,
}: AdminPaymentReceiptsPanelProps) {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentReceiptService.getAdminReceipts(reservationId);
      setReceipts(data);
    } catch (err) {
      setError(getPaymentReceiptErrorMessage(err, "No se pudieron cargar los comprobantes."));
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const handleDelete = async (receiptId: number) => {
    const confirmado = window.confirm("¿Eliminar este comprobante?");
    if (!confirmado) return;

    try {
      await paymentReceiptService.deleteAdminReceipt(receiptId);
      await loadReceipts();
    } catch (err) {
      setError(getPaymentReceiptErrorMessage(err, "No se pudo eliminar el comprobante."));
    }
  };

  const handleStatusChange = async (
    receipt: PaymentReceipt,
    status: PaymentReceiptStatus,
  ) => {
    try {
      await paymentReceiptService.updateReceiptStatus(receipt.id, status);
      await loadReceipts();
    } catch (err) {
      setError(getPaymentReceiptErrorMessage(err, "No se pudo actualizar el comprobante."));
    }
  };

  if (loading) {
    return <p className="adm-finance-panel-empty">Cargando comprobantes...</p>;
  }

  if (error) {
    return (
      <div className="adm-list-alert" role="alert">
        {error}{" "}
        <button type="button" onClick={loadReceipts}>
          Reintentar
        </button>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <p className="adm-finance-panel-empty">
        El cliente aún no ha subido comprobantes de abono.
      </p>
    );
  }

  return (
    <div className="adm-receipts-panel">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={18} className="text-[#d3a762]" />
        <h4 className="text-[15px] font-bold text-[#193355]">
          Comprobantes del cliente
        </h4>
      </div>

      <ul className="adm-receipts-list">
        {receipts.map((receipt) => (
          <li key={receipt.id} className="adm-receipts-item">
            <div className="adm-receipts-item-head">
              <div>
                <p className="adm-receipts-name">{receipt.original_name}</p>
                <p className="adm-receipts-meta">
                  {formatAdminDate(receipt.created_at.split("T")[0])}
                  {receipt.amount != null && receipt.amount !== ""
                    ? ` · ${formatMXN(Number(receipt.amount))}`
                    : ""}
                </p>
                {receipt.notes && (
                  <p className="adm-receipts-note">{receipt.notes}</p>
                )}
              </div>
              <span className={`adm-receipts-badge adm-receipts-badge--${receipt.status}`}>
                {STATUS_LABELS[receipt.status]}
              </span>
            </div>

            <div className="adm-receipts-preview">
              <SecuredFilePreview
                fileRef={receipt.url}
                originalName={receipt.original_name}
                iframeClassName="adm-receipts-preview-frame"
                imageClassName="adm-receipts-preview-img"
              />
            </div>

            <div className="adm-receipts-actions">
              <SecuredFileLink
                fileRef={receipt.url}
                className="adm-receipts-link"
              />

              <select
                className="adm-list-select adm-receipts-select"
                value={receipt.status}
                onChange={(e) =>
                  handleStatusChange(receipt, e.target.value as PaymentReceiptStatus)
                }
              >
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
              </select>

              <button
                type="button"
                className="adm-receipts-delete"
                title="Eliminar comprobante"
                onClick={() => handleDelete(receipt.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
