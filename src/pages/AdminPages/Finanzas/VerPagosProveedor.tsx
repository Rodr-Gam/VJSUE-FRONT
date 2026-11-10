import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import {
  supplierFinanceService,
  getSupplierFinanceErrorMessage,
} from "../../../supplierFinanceService";
import type { SupplierAccount, SupplierAccountState } from "../../../types/supplierFinance";
import { supplierAccountStateLabel } from "../../../utils/financeLabels";
import { formatMXN } from "../../../utils/reservationPricing";
import { SupplierAccountStateBadge } from "../../../components/Admin/finance/AccountStateBadge";
import AccountPaymentProgress from "../../../components/Admin/finance/AccountPaymentProgress";
import Pagination from "../../../components/common/Pagination";
import { SearchIcon, Banknote } from "lucide-react";
import { formatAdminDate } from "../../../utils/adminFormat";
import {
  SupplierTripPaymentAlertBadge,
  SupplierTripPaymentAlertBanner,
} from "../../../components/Admin/finance/SupplierTripPaymentAlert";
import FinanceArchiveButton from "../../../components/Admin/finance/FinanceArchiveButton";
import "../../../styles/AdminFinance.css";

function clientName(account: SupplierAccount): string {
  const user = account.reservation?.user;
  if (!user) return "—";
  return [user.name, user.last_name].filter(Boolean).join(" ");
}

function packageName(account: SupplierAccount): string {
  return account.reservation?.package?.name ?? "—";
}

export default function VerPagosProveedor() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<SupplierAccount[]>([]);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<SupplierAccountState | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripAlertCount, setTripAlertCount] = useState(0);
  const [tripAlertFilter, setTripAlertFilter] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await supplierFinanceService.getAccounts({
        search: search || undefined,
        state: stateFilter || undefined,
        page: currentPage,
        per_page: 20,
        trip_alert: tripAlertFilter || undefined,
      });
      setAccounts(result.data);
      setTotalPages(Math.max(1, result.meta.last_page));
      setTotalCount(result.meta.total);
      setTripAlertCount(result.trip_alert_count ?? 0);
    } catch (err) {
      setError(getSupplierFinanceErrorMessage(err, "No se pudieron cargar las cuentas."));
      setAccounts([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [search, stateFilter, currentPage, tripAlertFilter]);

  useEffect(() => {
    const timeout = setTimeout(loadAccounts, 350);
    return () => clearTimeout(timeout);
  }, [loadAccounts]);

  return (
    <AdminLayout>
      <div className="adm-list-page adm-accounts-page">
        <header className="adm-accounts-hero adm-accounts-hero--supplier">
          <div className="adm-accounts-hero-icon" aria-hidden="true">
            <Banknote size={22} />
          </div>
          <div>
            <h1 className="adm-accounts-hero-title">Pagos a proveedor</h1>
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
                setStateFilter(e.target.value as SupplierAccountState | "");
                setCurrentPage(1);
              }}
            >
              <option value="">Todos los estados</option>
              {(
                Object.entries(supplierAccountStateLabel) as [
                  SupplierAccountState,
                  string,
                ][]
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <SupplierTripPaymentAlertBanner
          count={tripAlertCount}
          filteringAlerts={tripAlertFilter}
          onFilterAlerts={() => {
            setTripAlertFilter((v) => !v);
            setCurrentPage(1);
          }}
        />

        <div className="adm-list-card adm-accounts-card">
          <div className="adm-list-head">
            <h2 className="adm-list-title">Cuentas con proveedores</h2>
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

          {loading && <p className="adm-empty">Cargando...</p>}

          {!loading && accounts.length === 0 && (
            <p className="adm-empty">
              No hay cuentas con montos a proveedor. Indica &quot;Cuánto pagaré a
              proveedor&quot; al crear reservas o tours.
            </p>
          )}

          {!loading && accounts.length > 0 && (
            <>
              <div className="hidden md:block adm-table-wrap">
                <table className="adm-table adm-table--lg">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Paquete / tour</th>
                      <th>Total proveedor</th>
                      <th>Pagado</th>
                      <th>Saldo</th>
                      <th>Salida viaje</th>
                      <th>Estado</th>
                      <th>Reserva</th>
                      <th aria-label="Archivar" />
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => {
                      const total = Number(account.total_amount) || 0;
                      const paid = Number(account.paid_amount) || 0;
                      const tripAlert = account.trip_payment_alert;
                      const rowClass = [
                        "adm-finance-clickable-row",
                        tripAlert?.level === "urgent"
                          ? "adm-finance-row--trip-alert-urgent"
                          : tripAlert
                            ? "adm-finance-row--trip-alert"
                            : "",
                      ]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <tr
                          key={account.id}
                          className={rowClass}
                          onClick={() =>
                            navigate(`/admin/pagos-proveedor/${account.id}`)
                          }
                        >
                          <td className="adm-pkg-id">#{account.id}</td>
                          <td>
                            <div className="adm-cell-strong">{clientName(account)}</div>
                            <div className="adm-cell-muted">
                              {account.reservation?.user?.email ?? ""}
                            </div>
                          </td>
                          <td>{packageName(account)}</td>
                          <td className="adm-money-cell">{formatMXN(total)}</td>
                          <td className="adm-money-cell adm-finance-stat-value--paid">
                            {formatMXN(paid)}
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
                            <div className="adm-supplier-trip-departure">
                              <span className="adm-date-cell">
                                {formatAdminDate(
                                  account.reservation?.departure_date,
                                )}
                              </span>
                              {tripAlert && (
                                <SupplierTripPaymentAlertBadge
                                  alert={tripAlert}
                                  compact
                                />
                              )}
                            </div>
                          </td>
                          <td>
                            <SupplierAccountStateBadge state={account.state} />
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
                              subjectType="supplier_account"
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
                  const tripAlert = account.trip_payment_alert;
                  return (
                    <article
                      key={account.id}
                      className={
                        "adm-mobile-card adm-accounts-mobile-card" +
                        (tripAlert?.level === "urgent"
                          ? " adm-finance-row--trip-alert-urgent"
                          : tripAlert
                            ? " adm-finance-row--trip-alert"
                            : "")
                      }
                      onClick={() =>
                        navigate(`/admin/pagos-proveedor/${account.id}`)
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          navigate(`/admin/pagos-proveedor/${account.id}`);
                        }
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
                            subjectType="supplier_account"
                            subjectId={account.id}
                            onArchived={loadAccounts}
                          />
                          <SupplierAccountStateBadge state={account.state} />
                        </div>
                      </div>
                      {tripAlert && (
                        <SupplierTripPaymentAlertBadge alert={tripAlert} />
                      )}
                      {total > 0 && (
                        <AccountPaymentProgress total={total} paid={paid} />
                      )}
                      <div className="adm-mobile-grid">
                        <p>
                          <span>Total prov.</span>
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
                          <span>Salida</span>
                          {formatAdminDate(account.reservation?.departure_date)}
                        </p>
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
