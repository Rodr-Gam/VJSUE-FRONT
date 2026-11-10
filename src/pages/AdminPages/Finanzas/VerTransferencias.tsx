import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "../../../layouts/AdminLayout";
import {
  getPaymentReceiptErrorMessage,
  groupReceiptsByClient,
  paymentReceiptService,
} from "../../../paymentReceiptService";
import type {
  ClientReceiptGroup,
  PaymentReceipt,
  PaymentReceiptStatus,
} from "../../../types/paymentReceipt";
import { formatMXN } from "../../../utils/reservationPricing";
import { formatAdminDate } from "../../../utils/adminFormat";
import SecuredFilePreview from "../../../components/secured/SecuredFilePreview";
import SecuredFileLink from "../../../components/secured/SecuredFileLink";
import { ArrowLeftRight, SearchIcon, Trash2 } from "lucide-react";
import FinanceArchiveButton from "../../../components/Admin/finance/FinanceArchiveButton";
import "../../../styles/AdminFinance.css";

const STATUS_LABELS: Record<PaymentReceiptStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

function clientFullName(group: ClientReceiptGroup) {
  return group.name;
}

export default function VerTransferencias() {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentReceiptStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentReceiptService.getAllAdminReceipts({
        search: search || undefined,
        status: statusFilter,
      });
      setReceipts(data);
    } catch (err) {
      setError(getPaymentReceiptErrorMessage(err, "No se pudieron cargar las transferencias."));
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(loadReceipts, 350);
    return () => clearTimeout(timeout);
  }, [loadReceipts]);

  const groups = useMemo(() => groupReceiptsByClient(receipts), [receipts]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.userId === selectedUserId) ?? null,
    [groups, selectedUserId],
  );

  const selectedReceipt = useMemo(() => {
    if (!selectedGroup) return null;
    if (selectedReceiptId) {
      return selectedGroup.receipts.find((r) => r.id === selectedReceiptId) ?? selectedGroup.receipts[0] ?? null;
    }
    return selectedGroup.receipts[0] ?? null;
  }, [selectedGroup, selectedReceiptId]);

  useEffect(() => {
    if (groups.length === 0) {
      setSelectedUserId(null);
      setSelectedReceiptId(null);
      return;
    }
    if (!selectedUserId || !groups.some((g) => g.userId === selectedUserId)) {
      setSelectedUserId(groups[0].userId);
      setSelectedReceiptId(groups[0].receipts[0]?.id ?? null);
    }
  }, [groups, selectedUserId]);

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

  const handleDelete = async (receiptId: number) => {
    if (!window.confirm("¿Eliminar este comprobante?")) return;
    try {
      await paymentReceiptService.deleteAdminReceipt(receiptId);
      await loadReceipts();
    } catch (err) {
      setError(getPaymentReceiptErrorMessage(err, "No se pudo eliminar el comprobante."));
    }
  };

  return (
    <AdminLayout>
      <div className="adm-list-page">
        <div className="adm-list-toolbar">
          <div className="adm-list-toolbar-grid adm-toolbar-3">
            <label className="adm-list-search">
              <SearchIcon size={18} className="text-[#d3a762] shrink-0" />
              <input
                type="text"
                placeholder="Buscar cliente o archivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              className="adm-list-select"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as PaymentReceiptStatus | "")
              }
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
        </div>

        <div className="adm-list-card">
          <div className="adm-list-head">
            <h2 className="adm-list-title flex items-center gap-2">
              <ArrowLeftRight size={22} className="text-[#d3a762]" />
              Transferencias
            </h2>
            <span className="adm-list-count">{receipts.length} comprobantes</span>
          </div>

          {error && (
            <div className="adm-list-alert" role="alert">
              {error}{" "}
              <button type="button" onClick={loadReceipts}>
                Reintentar
              </button>
            </div>
          )}

          {loading && <p className="adm-empty">Cargando transferencias...</p>}

          {!loading && groups.length === 0 && (
            <p className="adm-empty">
              Ningún cliente ha subido transferencias todavía.
            </p>
          )}

          {!loading && groups.length > 0 && (
            <div className="adm-transfers-layout">
              <aside className="adm-transfers-clients">
                <p className="adm-transfers-side-title">Clientes</p>
                <ul className="adm-transfers-client-list">
                  {groups.map((group) => (
                    <li key={group.userId}>
                      <button
                        type="button"
                        className={`adm-transfers-client-btn${
                          selectedUserId === group.userId
                            ? " adm-transfers-client-btn--active"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedUserId(group.userId);
                          setSelectedReceiptId(group.receipts[0]?.id ?? null);
                        }}
                      >
                        <span className="adm-transfers-client-name">
                          {clientFullName(group)}
                        </span>
                        <span className="adm-transfers-client-email">
                          {group.email}
                        </span>
                        <span className="adm-transfers-client-meta">
                          {group.receipts.length} comprobante
                          {group.receipts.length !== 1 ? "s" : ""}
                          {group.pendingCount > 0 && (
                            <em> · {group.pendingCount} pendiente{group.pendingCount !== 1 ? "s" : ""}</em>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>

              <section className="adm-transfers-detail">
                {selectedGroup && (
                  <>
                    <div className="adm-transfers-detail-head">
                      <div>
                        <h3 className="adm-transfers-detail-title">
                          {clientFullName(selectedGroup)}
                        </h3>
                        <p className="adm-transfers-detail-sub">{selectedGroup.email}</p>
                      </div>
                    </div>

                    <ul className="adm-transfers-receipt-tabs">
                      {selectedGroup.receipts.map((receipt) => (
                        <li key={receipt.id}>
                          <button
                            type="button"
                            className={`adm-transfers-receipt-tab${
                              selectedReceipt?.id === receipt.id
                                ? " adm-transfers-receipt-tab--active"
                                : ""
                            }`}
                            onClick={() => setSelectedReceiptId(receipt.id)}
                          >
                            {formatAdminDate(receipt.created_at.split("T")[0])}
                            <span className={`adm-receipts-badge adm-receipts-badge--${receipt.status}`}>
                              {STATUS_LABELS[receipt.status]}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>

                    {selectedReceipt && (
                      <div className="adm-transfers-receipt-panel">
                        <div className="adm-receipts-item-head">
                          <div>
                            <p className="adm-receipts-name">{selectedReceipt.original_name}</p>
                            <p className="adm-receipts-meta">
                              Reserva #{selectedReceipt.reservation_id}
                              {selectedReceipt.reservation?.package?.name
                                ? ` · ${selectedReceipt.reservation.package.name}`
                                : ""}
                              {selectedReceipt.amount != null && selectedReceipt.amount !== ""
                                ? ` · ${formatMXN(Number(selectedReceipt.amount))}`
                                : ""}
                            </p>
                            {selectedReceipt.notes && (
                              <p className="adm-receipts-note">{selectedReceipt.notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="adm-receipts-preview adm-receipts-preview--large">
                          <SecuredFilePreview
                            fileRef={selectedReceipt.url}
                            originalName={selectedReceipt.original_name}
                            iframeClassName="adm-receipts-preview-frame"
                            imageClassName="adm-receipts-preview-img"
                          />
                        </div>

                        <div className="adm-receipts-actions">
                          <SecuredFileLink
                            fileRef={selectedReceipt.url}
                            className="adm-receipts-link"
                            label="Abrir archivo"
                          />

                          <select
                            className="adm-list-select adm-receipts-select"
                            value={selectedReceipt.status}
                            onChange={(e) =>
                              handleStatusChange(
                                selectedReceipt,
                                e.target.value as PaymentReceiptStatus,
                              )
                            }
                          >
                            <option value="pending">Pendiente</option>
                            <option value="approved">Aprobado</option>
                            <option value="rejected">Rechazado</option>
                          </select>

                          <FinanceArchiveButton
                            subjectType="payment_receipt"
                            subjectId={selectedReceipt.id}
                            onArchived={loadReceipts}
                            className="adm-receipts-delete"
                          />

                          <button
                            type="button"
                            className="adm-receipts-delete"
                            title="Eliminar comprobante"
                            onClick={() => handleDelete(selectedReceipt.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
