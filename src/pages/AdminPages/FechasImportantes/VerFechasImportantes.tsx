import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import MonthCalendar from "../../../components/Admin/importantDates/MonthCalendar";
import ConfirmDeleteModal from "../../../components/common/ConfirmDeleteModal";
import {
  getImportantDateErrorMessage,
  importantDateService,
} from "../../../importantDateService";
import type {
  GoogleCalendarStatus,
  ImportantDate,
} from "../../../types/importantDate";
import {
  clientDisplayName,
  clientFilterOptions,
  displayImportantDateType,
  IMPORTANT_DATE_TYPE_OPTIONS,
  monthFilterOptions,
  summarizeText,
  syncFilterOptions,
  syncStatusLabel,
  withinDaysOptions,
} from "../../../utils/importantDateLabels";
import type {
  ImportantDateClientFilter,
  ImportantDateSyncFilter,
} from "../../../types/importantDate";
import { formatAdminDate } from "../../../utils/adminFormat";
import "../../../styles/AdminImportantDates.css";
import {
  CalendarDays,
  Link2,
  Link2Off,
  Plus,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  List,
  LayoutGrid,
  Star,
} from "lucide-react";

type ViewMode = "list" | "calendar" | "both";

function sortByMonthDay(dates: ImportantDate[]): ImportantDate[] {
  return [...dates].sort((a, b) => {
    const da = new Date(`${a.event_date}T12:00:00`);
    const db = new Date(`${b.event_date}T12:00:00`);
    const keyA = da.getMonth() * 32 + da.getDate();
    const keyB = db.getMonth() * 32 + db.getDate();
    if (keyA !== keyB) return keyA - keyB;
    return a.title.localeCompare(b.title, "es");
  });
}

export default function VerFechasImportantes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<ImportantDate[]>([]);
  const [upcoming, setUpcoming] = useState<ImportantDate[]>([]);
  const [calendarItems, setCalendarItems] = useState<ImportantDate[]>([]);
  const [google, setGoogle] = useState<GoogleCalendarStatus | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [syncFilter, setSyncFilter] = useState<ImportantDateSyncFilter>("");
  const [clientFilter, setClientFilter] = useState<ImportantDateClientFilter>("");
  const [eventMonthFilter, setEventMonthFilter] = useState("");
  const [withinDaysFilter, setWithinDaysFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImportantDate | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const sortedItems = useMemo(() => sortByMonthDay(items), [items]);

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);

  const listQueryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      type: typeFilter || undefined,
      sync_status: syncFilter || undefined,
      client: clientFilter || undefined,
      event_month: eventMonthFilter || undefined,
      within_days: withinDaysFilter || undefined,
    }),
    [search, typeFilter, syncFilter, clientFilter, eventMonthFilter, withinDaysFilter],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, upcomingRes, calRes, googleRes] = await Promise.all([
        importantDateService.list({ ...listQueryParams, per_page: 100 }),
        importantDateService.upcoming(8),
        importantDateService.calendarMonth(calYear, calMonth, listQueryParams),
        importantDateService.googleStatus(),
      ]);
      setItems(listRes.data);
      setUpcoming(upcomingRes);
      setCalendarItems(calRes);
      setGoogle(googleRes);
    } catch (err) {
      setError(getImportantDateErrorMessage(err, "No se pudieron cargar las fechas."));
    } finally {
      setLoading(false);
    }
  }, [listQueryParams, calYear, calMonth]);

  useEffect(() => {
    const timeout = setTimeout(loadAll, 300);
    return () => clearTimeout(timeout);
  }, [loadAll]);

  useEffect(() => {
    const googleParam = searchParams.get("google");
    const msg = searchParams.get("message");
    if (googleParam === "connected") {
      setToast("Google Calendar conectado correctamente.");
      searchParams.delete("google");
      searchParams.delete("message");
      setSearchParams(searchParams, { replace: true });
    } else if (googleParam === "error") {
      setToast(msg ? decodeURIComponent(msg) : "Error al conectar Google Calendar.");
      searchParams.delete("google");
      searchParams.delete("message");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleConnectGoogle = async () => {
    try {
      const url = await importantDateService.googleConnectUrl();
      window.location.href = url;
    } catch (err) {
      setToast(getImportantDateErrorMessage(err, "No se pudo iniciar la conexión."));
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await importantDateService.googleDisconnect();
      setToast("Google Calendar desconectado.");
      await loadAll();
    } catch (err) {
      setToast(getImportantDateErrorMessage(err));
    }
  };

  const handleSync = async (id: number) => {
    setSyncingId(id);
    try {
      await importantDateService.sync(id);
      setToast("Sincronización completada o actualizada.");
      await loadAll();
    } catch (err) {
      setToast(getImportantDateErrorMessage(err));
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await importantDateService.remove(deleteTarget.id);
      setDeleteTarget(null);
      setToast("Fecha eliminada.");
      await loadAll();
    } catch (err) {
      setToast(getImportantDateErrorMessage(err));
    }
  };

  const shiftMonth = (delta: number) => {
    let m = calMonth + delta;
    let y = calYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setCalMonth(m);
    setCalYear(y);
  };

  return (
    <AdminLayout>
      <div className="adm-list-page id-page">
        <header className="id-page-head">
          <div>
            <p className="id-eyebrow">Administración</p>
            <h1 className="adm-list-page-title">Fechas importantes</h1>
          </div>
          <div className="id-page-head-actions">
            <Link
              to="/admin/fechas-importantes/nueva?tipo=informativo"
              className="adm-list-cta adm-list-cta--ghost"
            >
              <Plus size={16} />
              Informativo
            </Link>
            <Link to="/admin/fechas-importantes/nueva" className="adm-list-cta">
              <Plus size={16} />
              Nueva fecha importante
            </Link>
          </div>
        </header>

        {toast && (
          <div className="id-toast" role="status">
            {toast}
            <button type="button" onClick={() => setToast(null)} aria-label="Cerrar">
              ×
            </button>
          </div>
        )}

        <section className="id-google-banner">
          <div className="id-google-status">
            <CalendarDays size={20} aria-hidden="true" />
            <div>
              <strong>Google Calendar</strong>
              {!google?.configured && (
                <p>Faltan variables GOOGLE_CALENDAR_* en el servidor. Ver docs/GOOGLE_CALENDAR.md</p>
              )}
              {google?.configured && !google.connected && (
                <p>No conectado — los registros quedarán pendientes de sincronización.</p>
              )}
              {google?.connected && (
                <p>
                  Conectado como <em>{google.google_email ?? "cuenta de agencia"}</em>
                </p>
              )}
            </div>
          </div>
          <div className="id-google-actions">
            {google?.connected ? (
              <button type="button" className="id-btn id-btn--ghost" onClick={handleDisconnectGoogle}>
                <Link2Off size={14} />
                Desconectar
              </button>
            ) : (
              <button
                type="button"
                className="id-btn id-btn--primary"
                onClick={handleConnectGoogle}
                disabled={!google?.configured}
              >
                <Link2 size={14} />
                Conectar Google Calendar
              </button>
            )}
          </div>
        </section>

        {upcoming.length > 0 && (
          <section className="id-upcoming">
            <h2 className="id-section-title">Próximas fechas</h2>
            <ul className="id-upcoming-list">
              {upcoming.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{clientDisplayName(item.user, { type: item.type })}</span>
                  </div>
                  <div className="id-upcoming-meta">
                    {item.next_occurrence
                      ? formatAdminDate(item.next_occurrence)
                      : formatAdminDate(item.event_date)}
                    {item.days_until != null && (
                      <em>
                        {item.days_until === 0
                          ? "Hoy"
                          : item.days_until === 1
                            ? "Mañana"
                            : `En ${item.days_until} días`}
                      </em>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="adm-list-toolbar id-filters-toolbar">
          <div className="adm-list-toolbar-grid id-filters-row">
            <label className="adm-list-search">
              <Search size={18} className="text-[#d3a762] shrink-0" />
              <input
                type="text"
                placeholder="Buscar cliente o acontecimiento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              className="adm-list-select"
              value={clientFilter}
              onChange={(e) =>
                setClientFilter(e.target.value as ImportantDateClientFilter)
              }
              aria-label="Filtrar por cliente"
            >
              {clientFilterOptions.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              className="adm-list-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filtrar por tipo de fecha"
            >
              <option value="">Todos los tipos</option>
              {IMPORTANT_DATE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              className="adm-list-select"
              value={syncFilter}
              onChange={(e) => setSyncFilter(e.target.value as ImportantDateSyncFilter)}
              aria-label="Filtrar por sincronización con Google"
            >
              {syncFilterOptions.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="adm-list-toolbar-grid id-filters-row id-filters-row--secondary">
            <select
              className="adm-list-select"
              value={withinDaysFilter}
              onChange={(e) => setWithinDaysFilter(e.target.value)}
              aria-label="Próximas fechas"
            >
              {withinDaysOptions.map((opt) => (
                <option key={opt.value || "any"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              className="adm-list-select"
              value={eventMonthFilter}
              onChange={(e) => setEventMonthFilter(e.target.value)}
              aria-label="Mes del acontecimiento"
            >
              {monthFilterOptions.map((opt) => (
                <option key={opt.value || "any"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="id-view-tabs" role="tablist" aria-label="Forma de ver fechas">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "list"}
            className={`id-view-tab${viewMode === "list" ? " id-view-tab--active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            <List size={16} />
            Lista
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "calendar"}
            className={`id-view-tab${viewMode === "calendar" ? " id-view-tab--active" : ""}`}
            onClick={() => setViewMode("calendar")}
          >
            <CalendarDays size={16} />
            Calendario
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "both"}
            className={`id-view-tab${viewMode === "both" ? " id-view-tab--active" : ""}`}
            onClick={() => setViewMode("both")}
          >
            <LayoutGrid size={16} />
            Ambos
          </button>
        </div>

        <div
          className={`id-main-grid${viewMode === "both" ? " id-main-grid--both" : " id-main-grid--single"}`}
        >
          {(viewMode === "calendar" || viewMode === "both") && (
            <MonthCalendar
              year={calYear}
              month={calMonth}
              items={calendarItems}
              onPrev={() => shiftMonth(-1)}
              onNext={() => shiftMonth(1)}
            />
          )}

          {(viewMode === "list" || viewMode === "both") && (
          <div className="adm-list-card id-list-card">
            <div className="adm-list-head">
              <h2 className="adm-list-title">Lista de fechas importantes</h2>
              <span className="adm-list-count">{items.length}</span>
            </div>
            <p className="id-list-hint">
              Todas tus fechas registradas, ordenadas por día y mes (se repiten cada año).
            </p>

            {loading && <p className="id-muted">Cargando...</p>}
            {error && <p className="id-alert id-alert--error">{error}</p>}

            {!loading && !error && items.length === 0 && (
              <p className="id-muted">Aún no hay fechas registradas.</p>
            )}

            {!loading && items.length > 0 && (
              <>
                <div className="hidden md:block adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Acontecimiento</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Observación</th>
                        <th>Sync</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedItems.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <strong>{row.title}</strong>
                            <br />
                            <small>{displayImportantDateType(row.type)}</small>
                          </td>
                          <td>
                            <span className="id-client-cell">
                              {row.user?.is_frequent_client && (
                                <Star
                                  size={14}
                                  className="id-client-star"
                                  aria-label="Cliente destacado"
                                  fill="currentColor"
                                />
                              )}
                              {clientDisplayName(row.user, { type: row.type })}
                            </span>
                          </td>
                          <td>{formatAdminDate(row.event_date)}</td>
                          <td>{summarizeText(row.observation)}</td>
                          <td>
                            <span className={`id-sync id-sync--${row.sync_status}`}>
                              {syncStatusLabel[row.sync_status]}
                            </span>
                            {row.sync_error && (
                              <small className="id-sync-error" title={row.sync_error}>
                                {summarizeText(row.sync_error, 40)}
                              </small>
                            )}
                          </td>
                          <td>
                            <div className="id-row-actions">
                              <Link
                                to={`/admin/fechas-importantes/${row.id}`}
                                className="id-action"
                                title="Editar"
                              >
                                <Pencil size={14} />
                              </Link>
                              {(row.sync_status === "error" || row.sync_status === "pending") && (
                                <button
                                  type="button"
                                  className="id-action"
                                  title="Reintentar sync"
                                  disabled={syncingId === row.id}
                                  onClick={() => handleSync(row.id)}
                                >
                                  <RefreshCw size={14} />
                                </button>
                              )}
                              <button
                                type="button"
                                className="id-action id-action--danger"
                                title="Eliminar"
                                onClick={() => setDeleteTarget(row)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="md:hidden space-y-3 id-mobile-list">
                  {sortedItems.map((row) => (
                    <li key={row.id} className="adm-mobile-card id-mobile-card">
                      <div className="id-mobile-head">
                        <strong>{row.title}</strong>
                        <span className={`id-sync id-sync--${row.sync_status}`}>
                          {syncStatusLabel[row.sync_status]}
                        </span>
                      </div>
                      <p>
                        {row.user?.is_frequent_client && (
                          <Star size={12} className="id-client-star inline" fill="currentColor" aria-hidden />
                        )}{" "}
                        {clientDisplayName(row.user, { type: row.type })} ·{" "}
                        {formatAdminDate(row.event_date)}
                      </p>
                      <p className="id-muted">{summarizeText(row.observation, 120)}</p>
                      <div className="id-row-actions">
                        <Link to={`/admin/fechas-importantes/${row.id}`} className="id-btn id-btn--ghost">
                          Editar
                        </Link>
                        {(row.sync_status === "error" || row.sync_status === "pending") && (
                          <button
                            type="button"
                            className="id-btn id-btn--ghost"
                            disabled={syncingId === row.id}
                            onClick={() => handleSync(row.id)}
                          >
                            Reintentar
                          </button>
                        )}
                        <button
                          type="button"
                          className="id-btn id-btn--danger"
                          onClick={() => setDeleteTarget(row)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="¿Eliminar fecha importante?"
        description="Se eliminará el registro y se intentará borrar el evento en Google Calendar."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
}
