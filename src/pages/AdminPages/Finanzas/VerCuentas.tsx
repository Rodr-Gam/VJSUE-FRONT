import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import { financeService, getFinanceErrorMessage } from "../../../financeService";
import type { Account, AccountState } from "../../../types/finance";
import { accountStateLabel } from "../../../utils/financeLabels";
import { formatMXN } from "../../../utils/reservationPricing";
import { AccountStateBadge } from "../../../components/Admin/finance/AccountStateBadge";
import Pagination from "../../../components/common/Pagination";
import { SearchIcon, Wallet } from "lucide-react";
import FinanceArchiveButton from "../../../components/Admin/finance/FinanceArchiveButton";
import AccountPaymentProgress from "../../../components/Admin/finance/AccountPaymentProgress";
import "../../../styles/AdminFinance.css";
import { installmentBalance } from "../../../utils/paymentPlan";
import type { ScheduledPayment } from "../../../types/finance";

function clientName(account: Account): string {
  const user = account.reservation?.user;
  if (!user) return "—";
  return [user.name, user.last_name].filter(Boolean).join(" ");
}

function packageName(account: Account): string {
  return account.reservation?.package?.name ?? "—";
}

function nextPlanInstallment(account: Account): ScheduledPayment | null {
  if (!account.payment_plan_managed) return null;
  const items = (account.scheduled_payments ?? [])
    .filter((item) => item.is_plan_installment)
    .sort((a, b) => (a.sequence ?? 999) - (b.sequence ?? 999));
  return (
    items.find((item) => {
      if (item.status === "paid" || item.status === "canceled") return false;
      return installmentBalance(item.amount, item.amount_settled ?? 0) > 0.004;
    }) ?? null
  );
}

export default function VerCuentas() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<AccountState | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await financeService.getAccounts({
        search: search || undefined,
        state: stateFilter || undefined,
        page: currentPage,
        per_page: 20,
      });
      setAccounts(result.data);
      setTotalPages(Math.max(1, result.meta.last_page));
      setTotalCount(result.meta.total);
    } catch (err) {
      setError(getFinanceErrorMessage(err, "No se pudieron cargar las cuentas."));
      setAccounts([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [search, stateFilter, currentPage]);

  useEffect(() => {
    const timeout = setTimeout(loadAccounts, 350);
    return () => clearTimeout(timeout);
  }, [loadAccounts]);

  return (
    <AdminLayout>
      <div className="adm-list-page adm-accounts-page">
        <header className="adm-accounts-hero">
          <div className="adm-accounts-hero-icon" aria-hidden="true">
            <Wallet size={22} />
          </div>
          <div>
            <h1 className="adm-accounts-hero-title">Cuentas por cobrar</h1>
            <p className="adm-accounts-hero-sub">
              Consulta saldos, planes de pago de tours y registra abonos desde el
              detalle de cada cuenta.
            </p>
          </div>
        </header>

        <div className="adm-list-toolbar">
          <div className="adm-list-toolbar-grid adm-toolbar-3">
            <label className="adm-list-search">
              <SearchIcon size={18} className="text-[#d3a762] shrink-0" />
              <input
                type="text"
                placeholder="Buscar cliente por nombre o email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>
            <select
              className="adm-list-select"
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value as AccountState | "");
                setCurrentPage(1);
              }}
            >
              <option value="">Todos los estados</option>
              {(
                Object.entries(accountStateLabel) as [AccountState, string][]
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="adm-list-card adm-accounts-card">
          <div className="adm-list-head">
            <h2 className="adm-list-title">Listado</h2>
            <span className="adm-list-count">{totalCount} cuentas</span>
          </div>

          {error && (
            <div className="adm-list-alert" role="alert">
              {error}{" "}
              <button type="button" onClick={loadAccounts}>
                Reintentar
              </button>
            </div>
          )}

          {loading && <p className="adm-empty">Cargando cuentas...</p>}

          {!loading && accounts.length === 0 && (
            <p className="adm-empty">No se encontraron cuentas.</p>
          )}

          {!loading && accounts.length > 0 && (
            <>
              <div className="hidden md:block adm-table-wrap">
                <table className="adm-table adm-table--lg">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Paquete</th>
                      <th>Total</th>
                      <th>Pagado</th>
                      <th>Saldo</th>
                      <th>Plan</th>
                      <th>Próx. parcialidad</th>
                      <th>Estado</th>
                      <th>Reserva</th>
                      <th aria-label="Archivar" />
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => {
                      const upcoming = nextPlanInstallment(account);
                      const total = Number(account.total_amount) || 0;
                      const paid = Number(account.paid_amount) || 0;
                      return (
                      <tr
                        key={account.id}
                        className="adm-finance-clickable-row"
                        onClick={() => navigate(`/admin/cuentas/${account.id}`)}
                      >
                        <td className="adm-pkg-id">#{account.id}</td>
                        <td>
                          <div className="adm-cell-strong">
                            {clientName(account)}
                          </div>
                          <div className="adm-cell-muted">
                            {account.reservation?.user?.email ?? ""}
                          </div>
                        </td>
                        <td>{packageName(account)}</td>
                        <td className="adm-money-cell">
                          {formatMXN(Number(account.total_amount))}
                        </td>
                        <td className="adm-money-cell adm-finance-stat-value--paid">
                          {formatMXN(Number(account.paid_amount))}
                        </td>
                        <td className="adm-accounts-progress-cell">
                          <span className="adm-money-cell adm-finance-stat-value--due">
                            {formatMXN(Number(account.balance_due))}
                          </span>
                          {total > 0 && (
                            <AccountPaymentProgress
                              total={total}
                              paid={paid}
                              compact
                              className="adm-account-progress--inline"
                            />
                          )}
                        </td>
                        <td>
                          {account.payment_plan_managed ? (
                            <span className="adm-payment-plan-chip adm-payment-plan-chip--table">
                              {account.payment_plan_installments ?? "—"} pagos
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="adm-money-cell">
                          {upcoming
                            ? formatMXN(
                                installmentBalance(
                                  upcoming.amount,
                                  upcoming.amount_settled ?? 0,
                                ),
                              )
                            : "—"}
                        </td>
                        <td>
                          <AccountStateBadge state={account.state} />
                        </td>
                        <td>
                          <Link
                            to={`/admin/reservas/detalle/${account.reservation_id}`}
                            className="text-[#193355] hover:text-[#d3a762] text-sm font-semibold"
                            onClick={(e) => e.stopPropagation()}
                          >
                            #{account.reservation_id}
                          </Link>
                        </td>
                        <td>
                          <FinanceArchiveButton
                            subjectType="account"
                            subjectId={account.id}
                            onArchived={loadAccounts}
                          />
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {accounts.map((account) => {
                  const total = Number(account.total_amount) || 0;
                  const paid = Number(account.paid_amount) || 0;
                  return (
                  <article
                    key={account.id}
                    className="adm-mobile-card adm-accounts-mobile-card"
                    onClick={() => navigate(`/admin/cuentas/${account.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(`/admin/cuentas/${account.id}`);
                    }}
                  >
                    <div className="adm-mobile-card-head">
                      <div>
                        <h3 className="adm-mobile-card-title">
                          {clientName(account)}
                        </h3>
                        <p className="adm-mobile-card-sub">
                          #{account.id} · {packageName(account)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <FinanceArchiveButton
                          subjectType="account"
                          subjectId={account.id}
                          onArchived={loadAccounts}
                        />
                        <AccountStateBadge state={account.state} />
                      </div>
                    </div>
                    {total > 0 && (
                      <AccountPaymentProgress total={total} paid={paid} />
                    )}
                    <div className="adm-mobile-grid">
                      <p>
                        <span>Total</span>
                        {formatMXN(total)}
                      </p>
                      <p>
                        <span>Pagado</span>
                        {formatMXN(paid)}
                      </p>
                      <p>
                        <span>Saldo</span>
                        {formatMXN(Number(account.balance_due))}
                      </p>
                      <p>
                        <span>Reserva</span>#{account.reservation_id}
                      </p>
                      {account.payment_plan_managed && (
                        <p>
                          <span>Plan</span>
                          {account.payment_plan_installments} pagos
                        </p>
                      )}
                    </div>
                  </article>
                );
                })}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="justify-center md:justify-end"
              />
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
