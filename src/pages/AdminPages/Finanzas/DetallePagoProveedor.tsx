import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowBigLeftIcon,
  PencilIcon,
  Plus,
  TrashIcon,
  Banknote,
} from "lucide-react";
import AdminLayout from "../../../layouts/AdminLayout";
import LoadingScreen from "../../../components/Admin/LoadingScreen";
import Toast from "../../../components/common/Toast";
import ConfirmDeleteModal from "../../../components/common/ConfirmDeleteModal";
import { useToast } from "../../../hooks/useToast";
import {
  supplierFinanceService,
  getSupplierFinanceErrorMessage,
} from "../../../supplierFinanceService";
import type {
  SupplierAccount,
  SupplierPayment,
  SupplierPaymentPayload,
} from "../../../types/supplierFinance";
import { paymentMethodLabel } from "../../../utils/financeLabels";
import { formatMXN } from "../../../utils/reservationPricing";
import { formatAdminDate } from "../../../utils/adminFormat";
import { SupplierAccountStateBadge } from "../../../components/Admin/finance/AccountStateBadge";
import AccountPaymentProgress from "../../../components/Admin/finance/AccountPaymentProgress";
import SupplierBreakdownList from "../../../components/Admin/finance/SupplierBreakdownList";
import SupplierPaymentFormModal from "../../../components/Admin/finance/SupplierPaymentFormModal";
import { SupplierTripPaymentAlertPanel } from "../../../components/Admin/finance/SupplierTripPaymentAlert";
import "../../../styles/AdminFinance.css";

function clientName(account: SupplierAccount): string {
  const user = account.reservation?.user;
  if (!user) return "—";
  return [user.name, user.last_name].filter(Boolean).join(" ");
}

function formatPaymentDate(value?: string): string {
  if (!value) return "—";
  const [datePart, timePart] = value.split(" ");
  const formattedDate = formatAdminDate(datePart);
  if (!timePart) return formattedDate;
  return `${formattedDate} ${timePart.slice(0, 5)}`;
}

export default function DetallePagoProveedor() {
  const { id } = useParams();
  const accountId = Number(id);
  const { mensaje, mostrarMensaje } = useToast();

  const [account, setAccount] = useState<SupplierAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    payment: SupplierPayment | null;
  }>({ open: false, payment: null });

  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    label: string;
  } | null>(null);

  const loadAccount = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const data = await supplierFinanceService.getAccount(accountId);
      setAccount(data);
    } catch (err) {
      mostrarMensaje(
        getSupplierFinanceErrorMessage(err, "No se pudo cargar la cuenta de proveedor."),
        "error",
      );
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, mostrarMensaje]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const payments = useMemo(
    () => account?.supplier_payments ?? [],
    [account],
  );

  const isCanceled = account?.state === "canceled";

  const handleSavePayment = async (payload: SupplierPaymentPayload) => {
    if (!account) return;
    setSaving(true);
    try {
      const response = paymentModal.payment
        ? await supplierFinanceService.updatePayment(
            account.id,
            paymentModal.payment.id,
            payload,
          )
        : await supplierFinanceService.createPayment(account.id, payload);

      setPaymentModal({ open: false, payment: null });
      setAccount(response.account);
      mostrarMensaje(response.message || "Pago guardado.", "success");
    } catch (err) {
      mostrarMensaje(
        getSupplierFinanceErrorMessage(err, "No se pudo guardar el pago."),
        "error",
      );
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!account || !deleteTarget) return;
    setSaving(true);
    try {
      await supplierFinanceService.deletePayment(account.id, deleteTarget.id);
      setDeleteTarget(null);
      await loadAccount();
      mostrarMensaje("Pago eliminado.", "success");
    } catch (err) {
      mostrarMensaje(getSupplierFinanceErrorMessage(err, "No se pudo eliminar."), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingScreen icon={Banknote} text="Cargando pagos a proveedor..." />
      </AdminLayout>
    );
  }

  if (!account) {
    return (
      <AdminLayout>
        <p className="adm-empty">No se encontró la cuenta de proveedor.</p>
        <Link to="/admin/pagos-proveedor" className="adm-finance-panel-link">
          <ArrowBigLeftIcon size={16} />
          Volver al listado
        </Link>
      </AdminLayout>
    );
  }

  const totalNum = Number(account.total_amount) || 0;
  const paidNum = Number(account.paid_amount) || 0;
  const breakdown = account.breakdown_lines ?? [];

  return (
    <AdminLayout>
      <div className="adm-list-page adm-account-page adm-supplier-account-page">
        <Link to="/admin/pagos-proveedor" className="adm-account-back">
          <ArrowBigLeftIcon size={18} aria-hidden="true" />
          Volver a pagos a proveedor
        </Link>

        <header className="adm-account-hero adm-account-hero--supplier">
          <div className="adm-account-hero-text">
            <p className="adm-account-hero-kicker">Pagos a proveedor</p>
            <h1 className="adm-account-hero-title">Cuenta proveedor #{account.id}</h1>
            <p className="adm-account-hero-sub">
              Reserva #{account.reservation_id} · {clientName(account)}
            </p>
          </div>
          <SupplierAccountStateBadge state={account.state} />
        </header>

        {account.trip_payment_alert && (
          <SupplierTripPaymentAlertPanel alert={account.trip_payment_alert} />
        )}

        <AccountPaymentProgress total={totalNum} paid={paidNum} />

        <div className="adm-account-layout">
          <aside className="adm-account-aside">
            <div className="adm-account-meta-card">
              <h3 className="adm-account-meta-title">Reserva</h3>
              <dl className="adm-account-meta-list">
                <div>
                  <dt>Paquete / tour</dt>
                  <dd>
                    {account.reservation?.package?.name ?? "—"}
                    {account.reservation?.package?.city?.name
                      ? ` · ${account.reservation.package.city.name}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt>Cliente</dt>
                  <dd>{clientName(account)}</dd>
                </div>
                <div>
                  <dt>Salida</dt>
                  <dd>{formatAdminDate(account.reservation?.departure_date)}</dd>
                </div>
              </dl>
              <Link
                to={`/admin/reservas/detalle/${account.reservation_id}`}
                className="adm-account-meta-link"
              >
                Ver detalle de la reserva
              </Link>
              <Link
                to={`/admin/cuentas`}
                className="adm-account-meta-link adm-account-meta-link--secondary"
              >
                Cuenta del cliente (cobros)
              </Link>
            </div>

            <div className="adm-account-breakdown-card">
              <h3 className="adm-account-meta-title">Desglose a proveedores</h3>
              <SupplierBreakdownList lines={breakdown} />
            </div>
          </aside>

          <div className="adm-account-main">
            <div className="adm-finance-summary adm-finance-summary--account">
              <div className="adm-finance-stat adm-finance-stat--accent">
                <p className="adm-finance-stat-label">Total a proveedores</p>
                <p className="adm-finance-stat-value">{formatMXN(totalNum)}</p>
              </div>
              <div className="adm-finance-stat adm-finance-stat--paid-border">
                <p className="adm-finance-stat-label">Pagado</p>
                <p className="adm-finance-stat-value adm-finance-stat-value--paid">
                  {formatMXN(paidNum)}
                </p>
              </div>
              <div className="adm-finance-stat adm-finance-stat--due-border">
                <p className="adm-finance-stat-label">Saldo pendiente</p>
                <p className="adm-finance-stat-value adm-finance-stat-value--due">
                  {formatMXN(Number(account.balance_due))}
                </p>
              </div>
            </div>

            <section className="adm-account-panel">
              <div className="adm-finance-tabs">
                <span className="adm-finance-tab adm-finance-tab--active">
                  Pagos registrados ({payments.length})
                </span>
              </div>

              <div className="flex justify-end mb-3">
                <button
                  type="button"
                  className="adm-list-cta"
                  disabled={isCanceled || totalNum <= 0}
                  onClick={() => setPaymentModal({ open: true, payment: null })}
                >
                  <Plus size={16} />
                  Registrar pago a proveedor
                </button>
              </div>

              {payments.length === 0 ? (
                <p className="adm-empty">Aún no hay pagos registrados a proveedores.</p>
              ) : (
                <div className="adm-table-wrap adm-table-wrap--sticky-actions">
                  <table className="adm-table adm-table--lg adm-table--supplier-payments">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Monto</th>
                        <th>Método</th>
                        <th>Referencia</th>
                        <th>Observaciones</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="adm-date-cell">
                            {formatPaymentDate(payment.paid_at)}
                          </td>
                          <td className="adm-cell-strong">
                            {formatMXN(Number(payment.amount))}
                          </td>
                          <td>{paymentMethodLabel[payment.payment_method]}</td>
                          <td>{payment.confirmation || "—"}</td>
                          <td className="adm-cell-notes">
                            {payment.observations || "—"}
                          </td>
                          <td className="adm-table-actions-cell">
                            <div className="adm-actions adm-finance-payment-actions">
                              <button
                                type="button"
                                className="adm-finance-inline-btn adm-finance-inline-btn--edit"
                                title="Editar pago"
                                disabled={isCanceled || saving}
                                onClick={() =>
                                  setPaymentModal({ open: true, payment })
                                }
                              >
                                <PencilIcon size={16} aria-hidden="true" />
                                Editar
                              </button>
                              <button
                                type="button"
                                className="adm-finance-inline-btn adm-finance-inline-btn--delete"
                                title="Eliminar pago"
                                disabled={isCanceled || saving}
                                onClick={() =>
                                  setDeleteTarget({
                                    id: payment.id,
                                    label: `pago de ${formatMXN(Number(payment.amount))}`,
                                  })
                                }
                              >
                                <TrashIcon size={16} aria-hidden="true" />
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <SupplierPaymentFormModal
        isOpen={paymentModal.open}
        title={paymentModal.payment ? "Editar pago a proveedor" : "Registrar pago a proveedor"}
        balanceDue={
          paymentModal.payment
            ? Number(account.balance_due) + Number(paymentModal.payment.amount)
            : Number(account.balance_due)
        }
        payment={paymentModal.payment}
        loading={saving}
        onClose={() => setPaymentModal({ open: false, payment: null })}
        onSubmit={handleSavePayment}
      />

      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        title="¿Eliminar pago a proveedor?"
        description={
          deleteTarget
            ? `Se eliminará el ${deleteTarget.label}. Esta acción no se puede deshacer.`
            : ""
        }
        loading={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <Toast mensaje={mensaje} />
    </AdminLayout>
  );
}
