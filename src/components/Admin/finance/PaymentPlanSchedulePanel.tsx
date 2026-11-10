import type { Account, ScheduledPayment } from "../../../types/finance";
import { formatAdminMoney, formatAdminDate } from "../../../utils/adminFormat";
import { installmentBalance } from "../../../utils/paymentPlan";
import { ScheduledStatusBadge } from "./AccountStateBadge";

function sortPlanInstallments(items: ScheduledPayment[]): ScheduledPayment[] {
  return [...items].sort((a, b) => {
    const seqA = a.sequence ?? 999;
    const seqB = b.sequence ?? 999;
    if (seqA !== seqB) return seqA - seqB;
    return a.due_date.localeCompare(b.due_date);
  });
}

function nextInstallment(
  items: ScheduledPayment[],
): ScheduledPayment | null {
  const ordered = sortPlanInstallments(items);
  return (
    ordered.find((item) => {
      if (item.status === "paid" || item.status === "canceled") return false;
      return installmentBalance(item.amount, item.amount_settled ?? 0) > 0.004;
    }) ?? null
  );
}

interface PaymentPlanSchedulePanelProps {
  account: Account;
  compact?: boolean;
  /** Oculta mini-resumen si la página ya muestra totales arriba. */
  showSummary?: boolean;
}

function planRowClass(status: ScheduledPayment["status"]): string {
  if (status === "paid") return "adm-plan-row--paid";
  if (status === "partial") return "adm-plan-row--partial";
  if (status === "overdue") return "adm-plan-row--overdue";
  if (status === "canceled") return "adm-plan-row--canceled";
  return "";
}

export default function PaymentPlanSchedulePanel({
  account,
  compact = false,
  showSummary = true,
}: PaymentPlanSchedulePanelProps) {
  if (!account.payment_plan_managed) {
    return null;
  }

  const planItems = sortPlanInstallments(
    (account.scheduled_payments ?? []).filter((item) => item.is_plan_installment),
  );

  if (planItems.length === 0) {
    return null;
  }

  const total = Number(account.total_amount) || 0;
  const paid = Number(account.paid_amount) || 0;
  const balance = Math.max(0, total - paid);
  const upcoming = nextInstallment(planItems);

  return (
    <div className={`adm-payment-plan${compact ? " adm-payment-plan--compact" : ""}`}>
      <div className="adm-payment-plan-head">
        <div className="adm-payment-plan-title-row">
          <h3 className="adm-finance-panel-title">Plan de pagos del tour</h3>
          <span className="adm-payment-plan-chip">
            {account.payment_plan_installments ?? planItems.length} parcialidades
          </span>
        </div>
        <p className="adm-finance-panel-sub">
          Los importes se recalculan al registrar abonos en la cuenta.
        </p>
        {upcoming && (
          <p className="adm-payment-plan-next">
            Próximo:{" "}
            <strong>
              ${formatAdminMoney(installmentBalance(upcoming.amount, upcoming.amount_settled))}
            </strong>{" "}
            · vence {formatAdminDate(upcoming.due_date)}
          </p>
        )}
      </div>

      {showSummary && (
        <div className="adm-finance-summary adm-finance-summary--inline adm-finance-summary--plan">
          <div className="adm-finance-stat adm-finance-stat--soft">
            <p className="adm-finance-stat-label">Total viaje</p>
            <p className="adm-finance-stat-value">${formatAdminMoney(total)}</p>
          </div>
          <div className="adm-finance-stat adm-finance-stat--soft adm-finance-stat--paid-border">
            <p className="adm-finance-stat-label">Abonado</p>
            <p className="adm-finance-stat-value adm-finance-stat-value--paid">
              ${formatAdminMoney(paid)}
            </p>
          </div>
          <div className="adm-finance-stat adm-finance-stat--soft adm-finance-stat--due-border">
            <p className="adm-finance-stat-label">Saldo pendiente</p>
            <p className="adm-finance-stat-value adm-finance-stat-value--due">
              ${formatAdminMoney(balance)}
            </p>
          </div>
        </div>
      )}

      <div className="adm-table-wrap adm-plan-table-wrap">
        <table className="adm-table adm-table--plan">
          <thead>
            <tr>
              <th>#</th>
              <th>Vencimiento</th>
              <th>Importe</th>
              <th>Abonado</th>
              <th>Pendiente</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {planItems.map((item) => {
              const settled = Number(item.amount_settled ?? 0);
              const pending = installmentBalance(item.amount, settled);
              return (
                <tr key={item.id} className={planRowClass(item.status)}>
                  <td className="adm-plan-seq">{item.sequence ?? "—"}</td>
                  <td>{formatAdminDate(item.due_date)}</td>
                  <td>${formatAdminMoney(Number(item.amount))}</td>
                  <td>${formatAdminMoney(settled)}</td>
                  <td>${formatAdminMoney(pending)}</td>
                  <td>
                    <ScheduledStatusBadge status={item.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
