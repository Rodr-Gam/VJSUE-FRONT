import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Wallet } from "lucide-react";
import { financeService, getFinanceErrorMessage } from "../../../financeService";
import type { Account } from "../../../types/finance";
import { formatMXN } from "../../../utils/reservationPricing";
import { formatAdminDate } from "../../../utils/adminFormat";
import { AccountStateBadge } from "./AccountStateBadge";
import AdminPaymentReceiptsPanel from "./AdminPaymentReceiptsPanel";
import ReservationCostBreakdown from "../../finance/ReservationCostBreakdown";

interface FinancePanelProps {
  reservationId: number;
}

function clientName(account: Account): string {
  const user = account.reservation?.user;
  if (!user) return "—";
  return [user.name, user.last_name].filter(Boolean).join(" ");
}

export default function FinancePanel({ reservationId }: FinancePanelProps) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await financeService.getAccountByReservation(reservationId);
      setAccount(data);
    } catch (err) {
      setError(getFinanceErrorMessage(err, "No se pudo cargar la información financiera."));
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  if (loading) {
    return <p className="adm-finance-panel-empty">Cargando finanzas...</p>;
  }

  if (error) {
    return (
      <div className="adm-list-alert" role="alert">
        {error}{" "}
        <button type="button" onClick={loadAccount}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!account) {
    return (
      <div>
        <p className="adm-finance-panel-empty">
          No se encontró cuenta financiera para esta reserva. Las reservas nuevas
          generan una cuenta automáticamente.
        </p>
        <div className="mt-4 pt-4 border-t border-slate-200">
          <AdminPaymentReceiptsPanel reservationId={reservationId} />
        </div>
      </div>
    );
  }

  const payments = account.partial_payments ?? [];
  const scheduled = account.scheduled_payments ?? [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Wallet size={20} className="text-[#d3a762]" />
        <h4 className="text-[15px] font-bold text-[#193355]">Finanzas</h4>
        <AccountStateBadge state={account.state} />
      </div>

      {account.reservation && (
        <ReservationCostBreakdown
          reservation={account.reservation}
          className="adm-finance-breakdown mb-3"
        />
      )}

      <div className="adm-finance-summary mb-3">
        <div className="adm-finance-stat">
          <p className="adm-finance-stat-label">Total</p>
          <p className="adm-finance-stat-value">
            {formatMXN(Number(account.total_amount))}
          </p>
        </div>
        <div className="adm-finance-stat">
          <p className="adm-finance-stat-label">Pagado</p>
          <p className="adm-finance-stat-value adm-finance-stat-value--paid">
            {formatMXN(Number(account.paid_amount))}
          </p>
        </div>
        <div className="adm-finance-stat">
          <p className="adm-finance-stat-label">Saldo pendiente</p>
          <p className="adm-finance-stat-value adm-finance-stat-value--due">
            {formatMXN(Number(account.balance_due))}
          </p>
        </div>
        <div className="adm-finance-stat">
          <p className="adm-finance-stat-label">Cliente</p>
          <p className="adm-finance-stat-value text-sm">{clientName(account)}</p>
        </div>
      </div>

      <div className="text-sm text-slate-600 space-y-1 mb-3">
        <p>
          <span className="font-semibold">Paquete:</span>{" "}
          {account.reservation?.package?.name ?? "—"}
        </p>
        <p>
          <span className="font-semibold">Salida:</span>{" "}
          {formatAdminDate(account.reservation?.departure_date)}
        </p>
        <p>
          <span className="font-semibold">Pagos registrados:</span> {payments.length}
          {" · "}
          <span className="font-semibold">Abonos programados:</span>{" "}
          {scheduled.length}
        </p>
      </div>

      <Link
        to={`/admin/cuentas/${account.id}`}
        className="adm-finance-panel-link"
      >
        Ver detalle de cuenta
        <ArrowRight size={16} />
      </Link>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <AdminPaymentReceiptsPanel reservationId={reservationId} />
      </div>
    </div>
  );
}
