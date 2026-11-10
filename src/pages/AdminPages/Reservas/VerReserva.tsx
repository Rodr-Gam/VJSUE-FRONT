import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../../api";
import { Link } from "react-router-dom";
import AdminLayout from "../../../layouts/AdminLayout";
import {
  SearchIcon,
  PencilIcon,
  ArchiveIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { formatAdminDate, formatAdminMoney } from "../../../utils/adminFormat";
import ReservationDocumentsModal from "../../../components/Admin/ReservationDocumentsModal";
import type { ReservationDocumentItem } from "../../../components/Admin/ReservationDocuments";

type ReservationState =
  | "confirmed"
  | "pending"
  | "canceled"
  | "finished"
  | "paid";

type PackageStatus = "active" | "inactive";

interface ReservationPackage {
  name: string;
  status?: PackageStatus;
  city?: { name: string };
  price_adult: string;
  price_child: string;
  price_junior: string;
  user?: { name: string };
}

interface ReservationDocumentRef {
  id: number;
  type: string;
}

interface Reservation {
  id: number;
  reference_person: string;
  state: ReservationState;
  reservation_date: string;
  departure_date: string;
  return_date: string;
  reserved_seats: number;
  adults?: number;
  juniors?: number;
  children?: number;
  total_amount?: string | number;
  package?: ReservationPackage;
  user?: { name?: string };
  observations: string;
  flight?: { id: number } | null;
  hotel?: { id: number } | null;
  transport?: { id: number } | null;
  documents?: ReservationDocumentRef[];
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

type StatusInfo = { label: string; badgeClass: string };

const STATUS_CONFIG: Record<ReservationState, StatusInfo> = {
  confirmed: {
    label: "Confirmada",
    badgeClass: "adm-badge adm-badge--confirmed",
  },
  pending: { label: "Pendiente", badgeClass: "adm-badge adm-badge--pending" },
  canceled: {
    label: "Cancelada",
    badgeClass: "adm-badge adm-badge--cancelled",
  },
  finished: {
    label: "Finalizada",
    badgeClass: "adm-badge adm-badge--finished",
  },
  paid: { label: "Pagada", badgeClass: "adm-badge adm-badge--paid" },
};

const DEFAULT_STATUS: StatusInfo = {
  label: "Desconocido",
  badgeClass: "adm-badge adm-badge--info",
};
const TOTAL_DOCUMENT_TYPES = 4;
const MAX_SEARCH_LENGTH = 100;
const SEARCH_DEBOUNCE_MS = 400;
const PER_PAGE = 20;
const NOTES_PREVIEW_LENGTH = 30;

function isPaginatedReservationResponse(
  data: unknown,
): data is PaginatedResponse<Reservation> {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as PaginatedResponse<Reservation>).data) &&
    typeof (data as PaginatedResponse<Reservation>).current_page === "number"
  );
}

function formatCurrency(value: string | number | undefined): string {
  return `$${formatAdminMoney(value)}`;
}

function StatusBadge({ state }: { state: ReservationState }) {
  const { label, badgeClass } = STATUS_CONFIG[state] ?? DEFAULT_STATUS;
  return <span className={badgeClass}>{label}</span>;
}

function PackageTypeBadge({ status }: { status?: PackageStatus }) {
  if (status !== "inactive") return null;
  return (
    <span className="ml-1 inline-block text-xs px-1.5 py-0.5 rounded-full bg-blue-200 text-gray-600 align-middle">
      Privado
    </span>
  );
}

function SeatsCell({ reservation }: { reservation: Reservation }) {
  const hasBreakdown =
    reservation.adults != null ||
    reservation.juniors != null ||
    reservation.children != null;

  const title = hasBreakdown
    ? `${reservation.adults ?? 0} adultos, ${reservation.juniors ?? 0} juniors, ${reservation.children ?? 0} niños`
    : undefined;

  return (
    <td className="adm-stock" title={title}>
      {reservation.reserved_seats || 0}
    </td>
  );
}

// NUEVO: indicador de pendientes de acción
function attentionReasons(reservation: Reservation): string[] {
  const reasons: string[] = [];
  const missingDocs =
    (reservation.documents?.length ?? 0) < TOTAL_DOCUMENT_TYPES;
  const missingServices =
    !reservation.flight || !reservation.hotel || !reservation.transport;

  if (missingDocs) reasons.push("Faltan documentos");
  if (missingServices) reasons.push("Faltan servicios por asignar");
  if (reservation.state === "pending")
    reasons.push("Reserva pendiente de confirmar");

  return reasons;
}

function AttentionFlag({ reservation }: { reservation: Reservation }) {
  const reasons = attentionReasons(reservation);
  if (reasons.length === 0) return null;

  return (
    <span title={reasons.join(" · ")} className="text-amber-500 inline-flex">
      <AlertTriangleIcon size={16} aria-hidden="true" />
    </span>
  );
}

function EditAction({ reservation }: { reservation: Reservation }) {
  if (reservation.state === "canceled") {
    return (
      <span
        title="No se puede editar una reserva cancelada"
        aria-disabled="true"
        className="R-btn-action R-btn-edit opacity-40 cursor-not-allowed"
      >
        <PencilIcon size={20} className="text-[#d3a762]" aria-hidden="true" />
      </span>
    );
  }

  return (
    <Link
      to={`/admin/reservas/${reservation.id}`}
      title="Editar"
      aria-label={`Editar reserva de ${reservation.reference_person || "cliente sin nombre"}`}
      className="R-btn-action R-btn-edit"
    >
      <PencilIcon size={20} className="text-[#d3a762]" aria-hidden="true" />
    </Link>
  );
}

function ServiceIcons({ reservation }: { reservation: Reservation }) {
  const services = [
    {
      key: "flight",
      label: "Vuelo",
      icon: "✈️",
      present: !!reservation.flight,
    },
    {
      key: "hotel",
      label: "Hotel",
      icon: "🏨",
      present: !!reservation.hotel,
    },
    {
      key: "transport",
      label: "Transporte",
      icon: "🚌",
      present: !!reservation.transport,
    },
  ];

  return (
    <div className="flex gap-1.5 justify-center">
      {services.map((s) => (
        <span
          key={s.key}
          title={s.present ? `${s.label} asignado` : `${s.label} pendiente`}
          className={`text-base transition-opacity ${
            s.present ? "opacity-100" : "opacity-25 grayscale"
          }`}
        >
          {s.icon}
        </span>
      ))}
    </div>
  );
}

function DocumentsBadge({
  reservation,
  onManage,
}: {
  reservation: Reservation;
  onManage: (reservation: Reservation) => void;
}) {
  const count = reservation.documents?.length ?? 0;

  let badgeClass = "bg-yellow-100 text-yellow-700";
  if (count === 0) {
    badgeClass = "bg-gray-100 text-gray-500";
  } else if (count === TOTAL_DOCUMENT_TYPES) {
    badgeClass = "bg-green-100 text-green-700";
  }

  const fullClassName =
    "adm-docs-cell-btn inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full " +
    badgeClass;
  const titleText =
    count +
    " de " +
    TOTAL_DOCUMENT_TYPES +
    " documentos · Clic para subir o gestionar";

  return (
    <button
      type="button"
      title={titleText}
      className={fullClassName}
      onClick={() => onManage(reservation)}
      aria-label={`Documentos de reserva ${reservation.id}, ${count} de ${TOTAL_DOCUMENT_TYPES}`}
    >
      📎 {count}/{TOTAL_DOCUMENT_TYPES}
    </button>
  );
}

function ArchiveAction({
  reservation,
  onArchive,
}: {
  reservation: Reservation;
  onArchive: (id: number) => void;
}) {
  return (
    <button
      type="button"
      title="Archivar reserva"
      aria-label={`Archivar reserva de ${reservation.reference_person || "cliente sin nombre"}`}
      onClick={() => onArchive(reservation.id)}
      className="R-btn-action R-btn-archive"
    >
      <ArchiveIcon size={20} className="text-[#d3a762]" aria-hidden="true" />
    </button>
  );
}

function Pagination({
  currentPage,
  lastPage,
  onPageChange,
}: {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}) {
  if (lastPage <= 1) return null;

  return (
    <nav className="adm-pagination" aria-label="Paginación de reservas">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="adm-pagination-btn"
        aria-label="Página anterior"
      >
        <ChevronLeftIcon size={16} />
      </button>
      <span className="adm-pagination-label">
        Página {currentPage} de {lastPage}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= lastPage}
        className="adm-pagination-btn"
        aria-label="Página siguiente"
      >
        <ChevronRightIcon size={16} />
      </button>
    </nav>
  );
}

export type VerReservaListMode = "default" | "tours";

interface VerReservaProps {
  listMode?: VerReservaListMode;
}

export default function VerReserva({ listMode = "default" }: VerReservaProps = {}) {
  const isToursList = listMode === "tours";
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<ReservationState | "">("");
  const [packageTypeFilter, setPackageTypeFilter] = useState<
    PackageStatus | ""
  >("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [docsModalReservation, setDocsModalReservation] =
    useState<Reservation | null>(null);

  const isMountedRef = useRef(true);

  const handleDocumentsUpdated = useCallback(
    (reservationId: number, documents: ReservationDocumentItem[]) => {
      const refs: ReservationDocumentRef[] = documents.map((d) => ({
        id: d.id,
        type: d.type,
      }));
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId ? { ...r, documents: refs } : r,
        ),
      );
      setDocsModalReservation((prev) =>
        prev?.id === reservationId ? { ...prev, documents: refs } : prev,
      );
    },
    [],
  );

  const openDocumentsModal = useCallback((reservation: Reservation) => {
    setDocsModalReservation(reservation);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, stateFilter, packageTypeFilter]);

  const cargarReservas = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await api.get("/reservations", {
          signal,
          params: {
            page,
            per_page: PER_PAGE,
            search: debouncedSearch || undefined,
            state: stateFilter || undefined,
            package_status: packageTypeFilter || undefined,
            booking_channel: isToursList ? "tour" : undefined,
          },
        });

        if (!isPaginatedReservationResponse(res.data)) {
          throw new Error("Formato de respuesta inesperado");
        }

        if (isMountedRef.current) {
          setReservations(res.data.data);
          setLastPage(res.data.last_page);
          setTotal(res.data.total);
        }
      } catch (err) {
        if (signal?.aborted) return;
        console.error("Error al cargar reservas:", err);
        if (isMountedRef.current) {
          setError(
            isToursList
              ? "No se pudieron cargar los tours. Intenta nuevamente."
              : "No se pudieron cargar las reservas. Intenta nuevamente.",
          );
        }
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    [page, debouncedSearch, stateFilter, packageTypeFilter, isToursList],
  );

  useEffect(() => {
    isMountedRef.current = true;
    const controller = new AbortController();
    cargarReservas(controller.signal);

    return () => {
      isMountedRef.current = false;
      controller.abort();
    };
  }, [cargarReservas]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value.slice(0, MAX_SEARCH_LENGTH));
  };

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStateFilter("");
    setPackageTypeFilter("");
  };

  const handleArchive = async (id: number) => {
    const confirmado = window.confirm(
      "¿Archivar esta reserva? El cliente dejará de verla, pero podrás consultarla después en el expediente del cliente.",
    );
    if (!confirmado) return;

    setArchivingId(id);
    try {
      await api.delete(`/reservations/${id}`);
      setReservations((prev) => prev.filter((r) => r.id !== id));
      setTotal((prev) => prev - 1);
    } catch (err) {
      console.error("Error al archivar reserva:", err);
      alert("No se pudo archivar la reserva. Intenta nuevamente.");
    } finally {
      setArchivingId(null);
    }
  };

  const hasActiveFilters = Boolean(search || stateFilter || packageTypeFilter);

  return (
    <AdminLayout>
      <div className="adm-list-page">
        <div className="adm-list-toolbar">
          <div className="adm-list-toolbar-grid adm-toolbar-3">
            <label className="adm-list-search">
              <SearchIcon size={18} className="text-[#d3a762] shrink-0" />
              <input
                id="reservation-search"
                type="text"
                value={search}
                onChange={handleSearchChange}
                maxLength={MAX_SEARCH_LENGTH}
                placeholder="Buscar referencia o paquete..."
                autoComplete="off"
              />
            </label>
            <select
              id="reservation-state-filter"
              title="Filtrar por estado"
              value={stateFilter}
              className="adm-list-select"
              onChange={(e) =>
                setStateFilter(e.target.value as ReservationState | "")
              }
            >
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              id="reservation-package-type-filter"
              title="Filtrar por tipo de paquete"
              value={packageTypeFilter}
              className="adm-list-select"
              onChange={(e) =>
                setPackageTypeFilter(e.target.value as PackageStatus | "")
              }
            >
              <option value="">Todos los paquetes</option>
              <option value="active">Solo públicos</option>
              <option value="inactive">Solo privados</option>
            </select>
            {isToursList ? (
              <Link to="/admin/reservas/tours" className="adm-list-cta">
                Crear tour
              </Link>
            ) : (
              <Link
                to="/admin/reservas/archivados"
                className="adm-list-cta adm-list-cta--ghost"
              >
                Expedientes archivados
              </Link>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="adm-list-cta adm-list-cta--ghost"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div className="adm-list-card">
          <div className="adm-list-head">
            <h2 className="adm-list-title">
              {isToursList ? "Tours registrados" : "Reservaciones recientes"}
            </h2>
            <span className="adm-list-count" aria-live="polite">
              {total} {isToursList ? "tours" : "reservas"}
            </span>
          </div>

          {error && (
            <div role="alert" className="adm-list-alert">
              {error}{" "}
              <button type="button" onClick={() => cargarReservas()}>
                Reintentar
              </button>
            </div>
          )}

          {isLoading && <p className="adm-empty">Cargando reservas...</p>}

          {!isLoading && reservations.length === 0 && (
            <p className="adm-empty">No se encontraron reservas.</p>
          )}

          {!isLoading && reservations.length > 0 && (
            <>
              <div className="hidden lg:block adm-table-wrap">
                <table className="adm-table adm-table--xl">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Cliente</th>
                      <th>Paquete</th>
                      <th>Estado</th>
                      <th>Lugares</th>
                      <th>Total</th>
                      <th>Destino</th>
                      <th>Servicios</th>
                      <th>Documentos</th>
                      <th>Salida</th>
                      <th>Referencia</th>
                      <th>Reserva</th>
                      <th>Regreso</th>
                      <th>Notas</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((reservation) => {
                      const notes = reservation.observations;
                      const notesPreview =
                        notes && notes.length > NOTES_PREVIEW_LENGTH
                          ? `${notes.slice(0, NOTES_PREVIEW_LENGTH)}…`
                          : notes;

                      return (
                        <tr key={reservation.id}>
                          <td>
                            <AttentionFlag reservation={reservation} />
                          </td>
                          <td>
                            {reservation.user?.name ||
                              reservation.package?.user?.name ||
                              "—"}
                          </td>
                          <td>
                            {reservation.package?.name || "—"}
                            <PackageTypeBadge
                              status={reservation.package?.status}
                            />
                          </td>
                          <td>
                            <StatusBadge state={reservation.state} />
                          </td>
                          <SeatsCell reservation={reservation} />
                          <td className="adm-cell-strong">
                            {formatCurrency(reservation.total_amount)}
                          </td>
                          <td>{reservation.package?.city?.name || "—"}</td>
                          <td>
                            <ServiceIcons reservation={reservation} />
                          </td>
                          <td>
                            <DocumentsBadge
                              reservation={reservation}
                              onManage={openDocumentsModal}
                            />
                          </td>
                          <td className="adm-date-cell">
                            {formatAdminDate(reservation.departure_date)}
                          </td>
                          <td className="adm-cell-strong">
                            {reservation.reference_person || "—"}
                          </td>
                          <td className="adm-date-cell">
                            {formatAdminDate(reservation.reservation_date)}
                          </td>
                          <td className="adm-date-cell">
                            {formatAdminDate(reservation.return_date)}
                          </td>
                          <td
                            className="adm-cell-notes"
                            title={notes || undefined}
                          >
                            {notesPreview || "—"}
                          </td>
                          <td>
                            <div className="adm-actions">
                              <Link
                                to={`/admin/reservas/detalle/${reservation.id}`}
                                className="R-btn-action"
                                title="Ver detalles"
                              >
                                <EyeIcon size={18} className="text-[#d3a762]" />
                              </Link>
                              <EditAction reservation={reservation} />
                              <ArchiveAction
                                reservation={reservation}
                                onArchive={handleArchive}
                              />
                              {archivingId === reservation.id && (
                                <span className="adm-cell-muted text-xs">
                                  Archivando...
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden space-y-3">
                {reservations.map((reservation) => (
                  <article key={reservation.id} className="adm-mobile-card">
                    <div className="adm-mobile-card-head">
                      <div className="min-w-0">
                        <h3 className="adm-mobile-card-title flex items-center gap-1.5">
                          <AttentionFlag reservation={reservation} />
                          {reservation.user?.name ||
                            reservation.package?.user?.name ||
                            "Sin cliente"}
                        </h3>
                        <p className="adm-mobile-card-sub">
                          {reservation.package?.name || "Sin paquete"}
                          <PackageTypeBadge
                            status={reservation.package?.status}
                          />
                          {" · #"}
                          {reservation.id}
                        </p>
                      </div>
                      <EditAction reservation={reservation} />
                    </div>
                    <div className="adm-mobile-grid">
                      <p>
                        <span>Estado</span>
                        <StatusBadge state={reservation.state} />
                      </p>
                      <p
                        title={`${reservation.adults ?? 0} adultos, ${reservation.juniors ?? 0} juniors, ${reservation.children ?? 0} niños`}
                      >
                        <span>Lugares</span>
                        {reservation.reserved_seats || 0}
                      </p>
                      <p>
                        <span>Total</span>
                        {formatCurrency(reservation.total_amount)}
                      </p>
                      <p>
                        <span>Destino</span>
                        {reservation.package?.city?.name || "—"}
                      </p>
                      <p>
                        <span>Salida</span>
                        {formatAdminDate(reservation.departure_date)}
                      </p>
                      <p>
                        <span>Referencia</span>
                        {reservation.reference_person || "—"}
                      </p>
                      <p style={{ gridColumn: "1 / -1" }}>
                        <span>Documentos</span>
                        <DocumentsBadge
                          reservation={reservation}
                          onManage={openDocumentsModal}
                        />
                      </p>
                      {reservation.observations && (
                        <p style={{ gridColumn: "1 / -1" }}>
                          <span>Notas</span>
                          {reservation.observations}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <Pagination
                currentPage={page}
                lastPage={lastPage}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      {docsModalReservation && (
        <ReservationDocumentsModal
          reservationId={docsModalReservation.id}
          reservationLabel={
            docsModalReservation.reference_person ||
            docsModalReservation.package?.name ||
            undefined
          }
          onClose={() => setDocsModalReservation(null)}
          onDocumentsChange={(documents) =>
            handleDocumentsUpdated(docsModalReservation.id, documents)
          }
        />
      )}
    </AdminLayout>
  );
}
