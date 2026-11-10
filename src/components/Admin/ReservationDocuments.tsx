import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../api";
import SecuredFileLink from "../secured/SecuredFileLink";
import {
  FileTextIcon,
  UploadIcon,
  TrashIcon,
  ExternalLinkIcon,
} from "lucide-react";

type DocumentType = "hotel_voucher" | "payment" | "transfer" | "other";

interface ReservationDocument {
  id: number;
  type: DocumentType;
  original_name: string;
  url: string;
  created_at: string;
}

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  hotel_voucher: "Cupón de hotel",
  payment: "Pago",
  transfer: "Traslado",
  other: "Otros",
};

const MAX_FILE_SIZE_MB = 10;

export type ReservationDocumentItem = ReservationDocument;

export default function ReservationDocuments({
  reservationId,
  readOnly = false,
  hideTitle = false,
  embedded = false,
  onDocumentsChange,
}: {
  reservationId: number;
  readOnly?: boolean;
  hideTitle?: boolean;
  /** Sin borde/card exterior (p. ej. dentro de un modal). */
  embedded?: boolean;
  onDocumentsChange?: (documents: ReservationDocument[]) => void;
}) {
  const [documents, setDocuments] = useState<ReservationDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onDocumentsChangeRef = useRef(onDocumentsChange);
  onDocumentsChangeRef.current = onDocumentsChange;

  const notifyChange = (docs: ReservationDocument[]) => {
    onDocumentsChangeRef.current?.(docs);
  };

  const cargarDocumentos = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/reservations/${reservationId}/documents`);
      const list = Array.isArray(res.data) ? res.data : [];
      const mapped = list.map((doc: ReservationDocument) => ({ ...doc }));
      setDocuments(mapped);
      notifyChange(mapped);
    } catch (err) {
      console.error("Error al cargar documentos:", err);
      try {
        const res = await api.get(`/reservations/${reservationId}`);
        const docs = res.data?.documents;
        const mapped = Array.isArray(docs) ? docs : [];
        setDocuments(mapped);
        notifyChange(mapped);
      } catch {
        setDocuments([]);
        notifyChange([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    cargarDocumentos();
  }, [cargarDocumentos]);

  const handleFileChange = async (
    type: DocumentType,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);

    if (file.type !== "application/pdf") {
      setError("Solo se permiten archivos PDF.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError("El archivo no puede pesar más de " + MAX_FILE_SIZE_MB + "MB.");
      return;
    }

    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", file);

    setUploadingType(type);
    try {
      const res = await api.post(
        `/reservations/${reservationId}/documents`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      setDocuments((prev) => {
        const next = [
          ...prev.filter((d) => d.type !== type),
          res.data.document,
        ];
        notifyChange(next);
        return next;
      });
    } catch (err) {
      console.error("Error al subir documento:", err);
      setError("No se pudo subir el archivo. Intenta nuevamente.");
    } finally {
      setUploadingType(null);
    }
  };

  const handleDelete = async (documentId: number) => {
    const confirmado = window.confirm("¿Eliminar este documento?");
    if (!confirmado) return;

    try {
      await api.delete(`/reservation-documents/${documentId}`);
      setDocuments((prev) => {
        const next = prev.filter((d) => d.id !== documentId);
        notifyChange(next);
        return next;
      });
    } catch (err) {
      console.error("Error al eliminar documento:", err);
      alert("No se pudo eliminar el documento.");
    }
  };

  const documentTypes: DocumentType[] = [
    "hotel_voucher",
    "payment",
    "transfer",
    "other",
  ];

  const rootClass = embedded
    ? "adm-res-docs-embedded"
    : "bg-white border border-gray-200 rounded-lg p-5";

  return (
    <div className={rootClass}>
      {!hideTitle && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Documentos de la reserva
        </h3>
      )}

      {readOnly && documents.length === 0 && !isLoading && (
        <p className="text-gray-500 text-sm">No hay documentos PDF adjuntos.</p>
      )}

      {error && (
        <div role="alert" className="text-red-500 text-sm mb-3">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-500 text-sm">Cargando documentos...</p>
      ) : readOnly ? (
        documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2"
              >
                <span className="text-sm font-medium text-gray-700">
                  {DOCUMENT_LABELS[doc.type]}
                </span>
                <div className="flex items-center justify-between gap-2 bg-gray-50 rounded-md px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileTextIcon
                      size={16}
                      className="text-[#d3a762] shrink-0"
                    />
                    <span className="text-xs text-gray-600 truncate">
                      {doc.original_name}
                    </span>
                  </div>
                  <SecuredFileLink
                    fileRef={doc.url}
                    className="p-1.5 rounded hover:bg-gray-200 shrink-0 inline-flex border-0 bg-transparent cursor-pointer"
                    label=""
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documentTypes.map((type) => {
            const doc = documents.find((d) => d.type === type);
            const isUploading = uploadingType === type;

            const uploadBorderClass = isUploading
              ? "border-gray-200"
              : "border-gray-300 hover:border-[#d3a762]";
            const uploadTextClass = isUploading
              ? "text-gray-400 cursor-wait"
              : "text-gray-500 hover:text-[#d3a762] cursor-pointer";
            const uploadLabelClass =
              "flex items-center justify-center gap-2 border-2 border-dashed rounded-md px-3 py-3 text-xs transition-colors " +
              uploadBorderClass +
              " " +
              uploadTextClass;

            return (
              <div
                key={type}
                className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2"
              >
                <span className="text-sm font-medium text-gray-700">
                  {DOCUMENT_LABELS[type]}
                </span>

                {doc ? (
                  <div className="flex items-center justify-between gap-2 bg-gray-50 rounded-md px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileTextIcon
                        size={16}
                        className="text-[#d3a762] shrink-0"
                      />
                      <span className="text-xs text-gray-600 truncate">
                        {doc.original_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <SecuredFileLink
                        fileRef={doc.url}
                        className="p-1.5 rounded hover:bg-gray-200 inline-flex border-0 bg-transparent cursor-pointer"
                        label=""
                      />
                      {!readOnly && (
                        <button
                          type="button"
                          title="Eliminar documento"
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 rounded hover:bg-red-100"
                        >
                          <TrashIcon size={14} className="text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <label className={uploadLabelClass}>
                    <UploadIcon size={14} />
                    {isUploading ? "Subiendo..." : "Subir PDF"}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => handleFileChange(type, e)}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
