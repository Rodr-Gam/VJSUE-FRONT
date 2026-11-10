import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowBigLeftIcon,
  PencilIcon,
  Plus,
  TrashIcon,
  Wallet,
  CalendarClock,
  Receipt,
} from "lucide-react";
import AdminLayout from "../../../layouts/AdminLayout";
import LoadingScreen from "../../../components/Admin/LoadingScreen";
import Toast from "../../../components/common/Toast";
import ConfirmDeleteModal from "../../../components/common/ConfirmDeleteModal";
import { useToast } from "../../../hooks/useToast";
import { financeService, getFinanceErrorMessage } from "../../../financeService";
import type {
  Account,
  PartialPayment,
  ScheduledPayment,
  UpdateScheduledPaymentPayload,
} from "../../../types/finance";
import {
  paymentMethodLabel,
  transactionTypeLabel,
} from "../../../utils/financeLabels";
import { formatMXN } from "../../../utils/reservationPricing";
import { formatAdminDate } from "../../../utils/adminFormat";
import { AccountStateBadge, ScheduledStatusBadge } from "../../../components/Admin/finance/AccountStateBadge";
import ReservationCostBreakdown from "../../../components/finance/ReservationCostBreakdown";
import PartialPaymentFormModal from "../../../components/Admin/finance/PartialPaymentFormModal";
import ScheduledPaymentFormModal from "../../../components/Admin/finance/ScheduledPaymentFormModal";
import PaymentPlanSchedulePanel from "../../../components/Admin/finance/PaymentPlanSchedulePanel";
import AccountPaymentProgress from "../../../components/Admin/finance/AccountPaymentProgress";
import "../../../styles/AdminFinance.css";

type FinanceTab = "payments" | "scheduled";

function clientName(account: Account): string {
  const user = account.reservation?.user;
  if (!user) return "—";
  return [user.name, user.last_name].filter(Boolean).join(" ");
}

function isScheduledOverdue(item: ScheduledPayment): boolean {
  if (item.status !== "pending") return false;
  const today = new Date().toISOString().slice(0, 10);
  const due = item.due_date.split("T")[0].split(" ")[0];
  return due < today;
}

function formatPaymentDate(value?: string): string {
  if (!value) return "—";
  const [datePart, timePart] = value.split(" ");
  const formattedDate = formatAdminDate(datePart);
  if (!timePart) return formattedDate;
  return `${formattedDate} ${timePart.slice(0, 5)}`;
}

function canEditScheduled(item: ScheduledPayment): boolean {
  return item.status === "pending" || item.status === "canceled";
}

export default function DetalleCuenta() {
  const { id } = useParams();
  const accountId = Number(id);
  const { mensaje, mostrarMensaje } = useToast();

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FinanceTab>("payments");
  const [saving, setSaving] = useState(false);

  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    payment: PartialPayment | null;
  }>({ open: false, payment: null });

  const [scheduledModal, setScheduledModal] = useState<{
    open: boolean;
    scheduled: ScheduledPayment | null;
  }>({ open: false, scheduled: null });

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "payment" | "scheduled";
    id: number;
    label: string;
  } | null>(null);

  const loadAccount = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const data = await financeService.getAccount(accountId);
      setAccount(data);
    } catch (err) {
      mostrarMensaje(getFinanceErrorMessage(err, "No se pudo cargar la cuenta."), "error");
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, mostrarMensaje]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const partialPayments = useMemo(
    () => account?.partial_payments ?? [],
    [account],
  );

  const scheduledPayments = useMemo(() => {
    const list = [...(account?.scheduled_payments ?? [])];
    return list.sort((a, b) => a.due_date.localeCompare(b.due_date));
  }, [account]);

  const isCanceled = account?.state === "canceled";

  const refreshAfterMutation = async (updated?: Account) => {
    if (updated) {
      setAccount(updated);
    } else {
      await loadAccount();
    }
  };

  const handleSavePayment = async (payload: Parameters<
    typeof financeService.createPartialPayment
  >[1]) => {
    if (!account) return;
    setSaving(true);
    try {
      const response = paymentModal.payment
        ? await financeService.updatePartialPayment(
            account.id,
            paymentModal.payment.id,
            payload,
          )
        : await financeService.createPartialPayment(account.id, payload);

      setPaymentModal({ open: false, payment: null });
      await refreshAfterMutation(response.account);
      mostrarMensaje(
        response.message || "Pago guardado correctamente.",
        "success",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveScheduled = async (
    payload: UpdateScheduledPaymentPayload,
  ) => {
    if (!account) return;
    setSaving(true);
    try {
      if (scheduledModal.scheduled) {
        await financeService.updateScheduledPayment(
          account.id,
          scheduledModal.scheduled.id,
          payload,
        );
        mostrarMensaje("Abono actualizado correctamente.", "success");
      } else {
        await financeService.createScheduledPayment(account.id, payload);
        mostrarMensaje("Abono programado creado.", "success");
      }
      setScheduledModal({ open: false, scheduled: null });
      await loadAccount();
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!account || !deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.type === "payment") {
        await financeService.deletePartialPayment(account.id, deleteTarget.id);
        mostrarMensaje("Pago eliminado.", "success");
      } else {
        await financeService.deleteScheduledPayment(account.id, deleteTarget.id);
        mostrarMensaje("Abono eliminado.", "success");
      }
      setDeleteTarget(null);
      await loadAccount();
    } catch (err) {
      mostrarMensaje(getFinanceErrorMessage(err, "No se pudo eliminar."), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingScreen icon={Wallet} text="Cargando cuenta..." />
      </AdminLayout>
    );
  }

  if (!account) {
    return (
      <AdminLayout>
        <p className="adm-empty">No se encontró la cuenta.</p>
        <Link to="/admin/cuentas" className="adm-finance-panel-link">
          <ArrowBigLeftIcon size={16} />
          Volver al listado
        </Link>
      </AdminLayout>
    );
  }

  const totalNum = Number(account.total_amount) || 0;
  const paidNum = Number(account.paid_amount) || 0;

  return (
    <AdminLayout>
      <div className="adm-list-page adm-account-page">
        <Link to="/admin/cuentas" className="adm-account-back">
          <ArrowBigLeftIcon size={18} aria-hidden="true" />
          Volver a cuentas por cobrar
        </Link>

        <header className="adm-account-hero">
          <div className="adm-account-hero-text">
            <p className="adm-account-hero-kicker">Cuenta por cobrar</p>
            <h1 className="adm-account-hero-title">Cuenta #{account.id}</h1>
            <p className="adm-account-hero-sub">
              Reserva #{account.reservation_id} · {clientName(account)}
            </p>
          </div>
          <AccountStateBadge state={account.state} />
        </header>

        <AccountPaymentProgress total={totalNum} paid={paidNum} />

        <div className="adm-account-layout">
          <aside className="adm-account-aside">
            <div className="adm-account-meta-card">
              <h3 className="adm-account-meta-title">Viaje</h3>
              <dl className="adm-account-meta-list">
                <div>
                  <dt>Paquete</dt>
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
                  <dt>Email</dt>
                  <dd>{account.reservation?.user?.email ?? "—"}</dd>
                </div>
                <div>
                  <dt>Salida</dt>
                  <dd>{formatAdminDate(account.reservation?.departure_date)}</dd>
                </div>
                <div>
                  <dt>Regreso</dt>
                  <dd>{formatAdminDate(account.reservation?.return_date)}</dd>
                </div>
                {account.payment_plan_managed && (
                  <div>
                    <dt>Plan de pagos</dt>
                    <dd>{account.payment_plan_installments ?? "—"} parcialidades</dd>
                  </div>
                )}
              </dl>
              <Link
                to={`/admin/reservas/detalle/${account.reservation_id}`}
                className="adm-account-meta-link"
              >
                Ver detalle de la reserva
              </Link>
            </div>

            {account.reservation && (
              <div className="adm-account-breakdown-card">
                <h3 className="adm-account-meta-title">Desglose al cliente</h3>
                <ReservationCostBreakdown
                  reservation={account.reservation}
                  className="adm-finance-breakdown adm-finance-breakdown--card"
                />
              </div>
            )}
          </aside>

          <div className="adm-account-main">
            <div className="adm-finance-summary adm-finance-summary--account">
              <div className="adm-finance-stat adm-finance-stat--accent">
                <p className="adm-finance-stat-label">Total del viaje</p>
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

            <PaymentPlanSchedulePanel account={account} showSummary={false} />

            <section className="adm-account-panel">
              <div className="adm-finance-tabs">
            <button
              type="button"
              className={`adm-finance-tab${activeTab === "payments" ? " adm-finance-tab--active" : ""}`}
              onClick={() => setActiveTab("payments")}
            >
              <Receipt size={16} />
              Pagos registrados ({partialPayments.length})
            </button>
            <button
              type="button"
              className={`adm-finance-tab${activeTab === "scheduled" ? " adm-finance-tab--active" : ""}`}
              onClick={() => setActiveTab("scheduled")}
            >
              <CalendarClock size={16} />
              Abonos programados ({scheduledPayments.length})
            </button>
          </div>

          {activeTab === "payments" && (
            <>
              <div className="flex justify-end mb-3">
                <button
                  type="button"
                  className="adm-list-cta"
                  disabled={isCanceled}
                  title={
                    isCanceled
                      ? "No se pueden registrar pagos en una cuenta cancelada"
                      : undefined
                  }
                  onClick={() =>
                    setPaymentModal({ open: true, payment: null })
                  }
                >
                  <Plus size={16} />
                  Registrar pago
                </button>
              </div>

              {partialPayments.length === 0 ? (
                <p className="adm-empty">Aún no hay pagos registrados.</p>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table adm-table--lg">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Monto</th>
                        <th>Tipo</th>
                        <th>Método</th>
                        <th>Confirmación</th>
                        <th>Proveedor</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partialPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="adm-date-cell">
                            {formatPaymentDate(payment.paid_at)}
                          </td>
                          <td className="adm-cell-strong">
                            {formatMXN(Number(payment.amount))}
                          </td>
                          <td>
                            {transactionTypeLabel[payment.transaction_type]}
                          </td>
                          <td>
                            {paymentMethodLabel[payment.payment_method]}
                          </td>
                          <td>{payment.confirmation || "—"}</td>
                          <td>{payment.sent_to_supplier || "—"}</td>
                          <td>
                            <div className="adm-actions">
                              <button
                                type="button"
                                className="R-btn-action R-btn-edit"
                                title="Editar pago"
                                disabled={isCanceled}
                                onClick={() =>
                                  setPaymentModal({
                                    open: true,
                                    payment,
                                  })
                                }
                              >
                                <PencilIcon
                                  size={18}
                                  className="text-[#d3a762]"
                                />
                              </button>
                              <button
                                type="button"
                                className="R-btn-action R-btn-edit"
                                title="Eliminar pago"
                                disabled={isCanceled}
                                onClick={() =>
                                  setDeleteTarget({
                                    type: "payment",
                                    id: payment.id,
                                    label: `pago de ${formatMXN(Number(payment.amount))}`,
                                  })
                                }
                              >
                                <TrashIcon
                                  size={18}
                                  className="text-red-500"
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === "scheduled" && (
            <>
              <div className="flex justify-end mb-3">
                <button
                  type="button"
                  className="adm-list-cta"
                  disabled={isCanceled}
                  onClick={() =>
                    setScheduledModal({ open: true, scheduled: null })
                  }
                >
                  <Plus size={16} />
                  Agregar abono
                </button>
              </div>

              {scheduledPayments.length === 0 ? (
                <p className="adm-empty">No hay abonos programados.</p>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table adm-table--lg">
                    <thead>
                      <tr>
                        <th>Fecha límite</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Observaciones</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduledPayments.map((item) => (
                        <tr
                          key={item.id}
                          className={
                            isScheduledOverdue(item)
                              ? "adm-finance-row--overdue"
                              : undefined
                          }
                        >
                          <td className="adm-date-cell">
                            {formatAdminDate(item.due_date)}
                          </td>
                          <td className="adm-cell-strong">
                            {formatMXN(Number(item.amount))}
                          </td>
                          <td>
                            <ScheduledStatusBadge status={item.status} />
                          </td>
                          <td className="adm-cell-notes">
                            {item.observations || "—"}
                          </td>
                          <td>
                            <div className="adm-actions">
                              {canEditScheduled(item) && !isCanceled && (
                                <>
                                  <button
                                    type="button"
                                    className="R-btn-action R-btn-edit"
                                    title="Editar abono"
                                    onClick={() =>
                                      setScheduledModal({
                                        open: true,
                                        scheduled: item,
                                      })
                                    }
                                  >
                                    <PencilIcon
                                      size={18}
                                      className="text-[#d3a762]"
                                    />
                                  </button>
                                  <button
                                    type="button"
                                    className="R-btn-action R-btn-edit"
                                    title="Eliminar abono"
                                    onClick={() =>
                                      setDeleteTarget({
                                        type: "scheduled",
                                        id: item.id,
                                        label: `abono del ${formatAdminDate(item.due_date)}`,
                                      })
                                    }
                                  >
                                    <TrashIcon
                                      size={18}
                                      className="text-red-500"
                                    />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
            </section>
          </div>
        </div>
      </div>

      <PartialPaymentFormModal
        isOpen={paymentModal.open}
        title={paymentModal.payment ? "Editar pago" : "Registrar pago"}
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

      <ScheduledPaymentFormModal
        isOpen={scheduledModal.open}
        title={
          scheduledModal.scheduled
            ? "Editar abono programado"
            : "Agregar abono programado"
        }
        scheduled={scheduledModal.scheduled}
        allowStatusEdit={
          !!scheduledModal.scheduled &&
          canEditScheduled(scheduledModal.scheduled)
        }
        loading={saving}
        onClose={() => setScheduledModal({ open: false, scheduled: null })}
        onSubmit={handleSaveScheduled}
      />

      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        title="¿Eliminar registro?"
        description={
          deleteTarget
            ? `Se eliminará el ${deleteTarget.label}. Esta acción no se puede deshacer.`
            : undefined
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <Toast mensaje={mensaje} />
    </AdminLayout>
  );
}
