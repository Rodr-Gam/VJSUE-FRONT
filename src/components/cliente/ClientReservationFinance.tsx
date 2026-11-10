import type { Account, PartialPayment, ScheduledPayment } from "../../types/finance";
import {
  accountStateLabel,
  paymentMethodLabel,
  scheduledStatusLabel,
  transactionTypeLabel,
} from "../../utils/financeLabels";
import { buildClientAccountFallback } from "../../utils/financeAccount";
import { formatMXN } from "../../utils/reservationPricing";
import { formatAdminDate } from "../../utils/adminFormat";
import { CalendarClock, Wallet } from "lucide-react";
import ClientPaymentReceiptUpload from "./ClientPaymentReceiptUpload";
import PaymentPlanSchedulePanel from "../Admin/finance/PaymentPlanSchedulePanel";
import ReservationCostBreakdown from "../finance/ReservationCostBreakdown";
import type { Reservation } from "../../types/reservation";

function formatPaymentDate(value?: string): string {
  if (!value) return "—";
  const [datePart, timePart] = value.split(" ");
  const formattedDate = formatAdminDate(datePart);
  if (!timePart) return formattedDate;
  return `${formattedDate} ${timePart.slice(0, 5)}`;
}

function sortedPayments(payments: PartialPayment[]): PartialPayment[] {
  return [...payments].sort((a, b) => b.paid_at.localeCompare(a.paid_at));
}

function sortedScheduled(payments: ScheduledPayment[]): ScheduledPayment[] {
  return [...payments].sort((a, b) => a.due_date.localeCompare(b.due_date));
}

interface ClientReservationFinanceProps {
  reservationId: number;
  account: Account | null;
  loading: boolean;
  reservationTotal?: string | number | null;
  reservationState?: string;
  reservation?: Pick<
    Reservation,
    | "adults"
    | "juniors"
    | "children"
    | "reserved_seats"
    | "unit_price_adult"
    | "unit_price_junior"
    | "unit_price_child"
    | "flight"
    | "transport"
    | "hotel"
  >;
  showUpload?: boolean;
}

export default function ClientReservationFinance({
  reservationId,
  account,
  loading,
  reservationTotal,
  reservationState,
  reservation,
  showUpload = true,
}: ClientReservationFinanceProps) {
  if (loading) {
    return (
      <div className="dr-card">
        <h2 className="dr-section-title">Pagos y abonos</h2>
        <p className="dr-finance-muted">Cargando información de pagos...</p>
      </div>
    );
  }

  const displayAccount =
    account ??
    buildClientAccountFallback(reservationId, reservationTotal, "pending");
  const usingFallback = account == null;

  const total =
    Number(reservationTotal) || Number(displayAccount.total_amount) || 0;
  const paid = Number(displayAccount.paid_amount) || 0;
  const balance = Math.max(0, total - paid);
  const payments = sortedPayments(displayAccount.partial_payments ?? []);
  const scheduled = sortedScheduled(displayAccount.scheduled_payments ?? []);
  const statusLabel = accountStateLabel[displayAccount.state] ?? displayAccount.state;
  const uploadsDisabled =
    reservationState === "canceled" ||
    reservationState === "cancelada" ||
    reservationState === "cancelled";

  return (
    <div className="dr-card">
      <div className="dr-finance-head">
        <h2 className="dr-section-title">Pagos y abonos</h2>
        <span className={`dr-finance-status dr-finance-status--${displayAccount.state}`}>
          {statusLabel}
        </span>
      </div>

      {reservation && <ReservationCostBreakdown reservation={reservation} />}

      <div className="dr-finance-grid">
        <div className="dr-finance-stat">
          <span className="dr-finance-stat-label">Total del viaje</span>
          <span className="dr-finance-stat-value">{formatMXN(total)}</span>
        </div>
        <div className="dr-finance-stat dr-finance-stat--paid">
          <span className="dr-finance-stat-label">Llevas pagado</span>
          <span className="dr-finance-stat-value">{formatMXN(paid)}</span>
        </div>
        <div className="dr-finance-stat dr-finance-stat--due">
          <span className="dr-finance-stat-label">Falta por pagar</span>
          <span className="dr-finance-stat-value">{formatMXN(balance)}</span>
        </div>
      </div>

      {displayAccount.payment_plan_managed ? (
        <div className="dr-payment-plan-wrap">
          <PaymentPlanSchedulePanel account={displayAccount} compact />
        </div>
      ) : (
        scheduled.length > 0 && (
          <>
            <p className="dr-finance-list-title">
              <CalendarClock size={14} aria-hidden="true" />
              Abonos programados
            </p>
            <ul className="dr-finance-scheduled">
              {scheduled.map((item) => (
                <li key={item.id} className="dr-finance-scheduled-item">
                  <div className="dr-finance-scheduled-main">
                    <span className="dr-finance-scheduled-date">
                      {formatAdminDate(item.due_date)}
                    </span>
                    <span className="dr-finance-scheduled-amount">
                      {formatMXN(Number(item.amount))}
                    </span>
                  </div>
                  <span
                    className={`dr-finance-scheduled-status dr-finance-scheduled-status--${item.status}`}
                  >
                    {scheduledStatusLabel[item.status] ?? item.status}
                  </span>
                  {item.observations && (
                    <p className="dr-finance-scheduled-note">{item.observations}</p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )
      )}

      {payments.length > 0 ? (
        <>
          <p className="dr-finance-list-title">
            <Wallet size={14} aria-hidden="true" />
            Pagos registrados por la agencia
          </p>
          <ul className="dr-finance-payments">
            {payments.map((payment) => (
              <li key={payment.id} className="dr-finance-payment">
                <div className="dr-finance-payment-main">
                  <span className="dr-finance-payment-amount">
                    {formatMXN(Number(payment.amount))}
                  </span>
                  <span className="dr-finance-payment-type">
                    {transactionTypeLabel[payment.transaction_type]}
                  </span>
                </div>
                <div className="dr-finance-payment-meta">
                  <span>{formatPaymentDate(payment.paid_at)}</span>
                  <span>{paymentMethodLabel[payment.payment_method]}</span>
                  {payment.confirmation && (
                    <span>Ref: {payment.confirmation}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="dr-finance-muted">
          Aún no hay abonos registrados. Cuando la agencia registre un pago, lo
          verás aquí.
        </p>
      )}

      {usingFallback && (
        <p className="dr-finance-muted">
          El detalle de pagos se actualizará cuando la agencia registre abonos en
          tu cuenta.
        </p>
      )}

      {showUpload && (
        <ClientPaymentReceiptUpload
          reservationId={reservationId}
          disabled={uploadsDisabled}
        />
      )}

      <p className="dr-finance-note">
        Los comprobantes que subas serán revisados por la agencia. Cuando aprueben
        tu pago, lo verás reflejado en abonos registrados.
      </p>
    </div>
  );
}
