import { useCallback, useEffect, useRef, useState } from "react";
import type { PaymentReceipt } from "../../types/paymentReceipt";
import {
  getPaymentReceiptErrorMessage,
  paymentReceiptService,
} from "../../paymentReceiptService";
import { formatMXN } from "../../utils/reservationPricing";
import { formatAdminDate } from "../../utils/adminFormat";
import SecuredFileLink from "../secured/SecuredFileLink";
import { FileUp, ImageIcon, Trash2 } from "lucide-react";

const STATUS_LABELS: Record<PaymentReceipt["status"], string> = {
  pending: "En revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
};

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

interface ClientPaymentReceiptUploadProps {
  reservationId: number;
  disabled?: boolean;
}

export default function ClientPaymentReceiptUpload({
  reservationId,
  disabled = false,
}: ClientPaymentReceiptUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await paymentReceiptService.getMyReceipts(reservationId);
      setReceipts(data);
    } catch (error) {
      setMessage({
        type: "error",
        text: getPaymentReceiptErrorMessage(error, "No se pudieron cargar tus comprobantes."),
      });
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setMessage(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setMessage({
        type: "error",
        text: "Solo se permiten archivos JPG, PNG, WEBP o PDF.",
      });
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setMessage({
        type: "error",
        text: `El archivo no puede pesar más de ${MAX_FILE_SIZE_MB} MB.`,
      });
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setMessage({ type: "error", text: "Selecciona una foto o archivo PDF." });
      return;
    }

    try {
      setUploading(true);
      setMessage(null);
      await paymentReceiptService.uploadMyReceipt(reservationId, {
        file: selectedFile,
        amount,
        notes,
      });
      setSelectedFile(null);
      setAmount("");
      setNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage({
        type: "success",
        text: "Transferencia enviada. La agencia la revisará y registrará tu abono.",
      });
      await loadReceipts();
    } catch (error) {
      setMessage({
        type: "error",
        text: getPaymentReceiptErrorMessage(error),
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (receiptId: number) => {
    try {
      await paymentReceiptService.deleteMyReceipt(reservationId, receiptId);
      setMessage({ type: "success", text: "Comprobante eliminado." });
      await loadReceipts();
    } catch (error) {
      setMessage({
        type: "error",
        text: getPaymentReceiptErrorMessage(error, "No se pudo eliminar el comprobante."),
      });
    }
  };

  return (
    <div className="dr-receipts" id="comprobantes">
      <div className="dr-receipts-head">
        <h3 className="dr-receipts-title">
          <FileUp size={16} aria-hidden="true" />
          Subir transferencia o comprobante
        </h3>
        <p className="dr-receipts-subtitle">
          Adjunta la foto o PDF de tu depósito, transferencia o pago.
        </p>
      </div>

      {disabled && (
        <div className="dr-receipt-alert dr-receipt-alert--error">
          Esta reserva está cancelada. No puedes subir nuevos comprobantes.
        </div>
      )}

      {message && (
        <div className={`dr-receipt-alert dr-receipt-alert--${message.type}`}>
          {message.text}
        </div>
      )}

      <form className="dr-receipt-form" onSubmit={handleUpload}>
        <label className="dr-receipt-file">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            disabled={disabled || uploading}
          />
          <span className="dr-receipt-file-box">
            <ImageIcon size={22} aria-hidden="true" />
            <span>
              {selectedFile ? selectedFile.name : "Toca para elegir foto o PDF"}
            </span>
            <small>JPG, PNG, WEBP o PDF · máx. 5 MB</small>
          </span>
        </label>

        <div className="dr-receipt-fields">
          <label>
            Monto del abono (opcional)
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ej. 500.00"
              disabled={disabled || uploading}
            />
          </label>
          <label>
            Notas (opcional)
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Transferencia Banorte"
              maxLength={500}
              disabled={disabled || uploading}
            />
          </label>
        </div>

        <button
          type="submit"
          className="dr-receipt-submit"
          disabled={disabled || uploading || !selectedFile}
        >
          {uploading ? "Enviando..." : "Enviar comprobante"}
        </button>
      </form>

      <div className="dr-receipt-list-wrap">
        <p className="dr-finance-list-title">Tus comprobantes enviados</p>

        {loading && <p className="dr-finance-muted">Cargando comprobantes...</p>}

        {!loading && receipts.length === 0 && (
          <p className="dr-finance-muted">
            Aún no has subido comprobantes para esta reserva.
          </p>
        )}

        {!loading && receipts.length > 0 && (
          <ul className="dr-receipt-list">
            {receipts.map((receipt) => (
              <li key={receipt.id} className="dr-receipt-item">
                <div className="dr-receipt-item-main">
                  <div>
                    <p className="dr-receipt-item-name">{receipt.original_name}</p>
                    <p className="dr-receipt-item-meta">
                      {formatAdminDate(receipt.created_at.split("T")[0])}
                      {receipt.amount != null && receipt.amount !== ""
                        ? ` · ${formatMXN(Number(receipt.amount))}`
                        : ""}
                    </p>
                    {receipt.notes && (
                      <p className="dr-receipt-item-note">{receipt.notes}</p>
                    )}
                    {receipt.admin_notes && receipt.status === "rejected" && (
                      <p className="dr-receipt-item-note dr-receipt-item-note--warn">
                        {receipt.admin_notes}
                      </p>
                    )}
                  </div>
                  <span className={`dr-receipt-status dr-receipt-status--${receipt.status}`}>
                    {STATUS_LABELS[receipt.status]}
                  </span>
                </div>

                <div className="dr-receipt-item-actions">
                  <SecuredFileLink
                    fileRef={receipt.url}
                    className="dr-receipt-link"
                  />
                  {receipt.status === "pending" && (
                    <button
                      type="button"
                      className="dr-receipt-delete"
                      onClick={() => handleDelete(receipt.id)}
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
