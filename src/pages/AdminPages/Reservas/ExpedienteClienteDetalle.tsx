import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArchiveIcon,
  ArrowBigLeftIcon,
  ArrowRightIcon,
  BuildingIcon,
  BusIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FileTextIcon,
  MailIcon,
  PackageIcon,
  PhoneIcon,
  PlaneIcon,
  UserIcon,
  Wallet,
} from "lucide-react";
import AdminLayout from "../../../layouts/AdminLayout";
import LoadingScreen from "../../../components/Admin/LoadingScreen";
import ReservationDocuments from "../../../components/Admin/ReservationDocuments";
import FinancePanel from "../../../components/Admin/finance/FinancePanel";
import { StatusBadge } from "../../../components/common/DetailBlocks";
import { api } from "../../../api";
import {
  formatDate,
  formatPrice,
  OCCUPANCY_LABELS,
} from "../../../utils/format";
import { profitFromRecord } from "../../../utils/serviceProfit";
import "../../../styles/AdminExpediente.css";

interface RoomPrice {
  id: number;
  occupancy_type: string;
  nightly_rate: string;
  total_rooms: number;
}

interface ServiceFlight {
  airline_name: string;
  destination: string;
  flight_schedule: string;
  hgdl_key: string;
  booking_source: string | null;
  provider_cost: string;
  client_cost?: string | null;
  profit?: number | string | null;
  observations: string | null;
}

interface ServiceHotel {
  name: string;
  destination: string;
  hgdl_key: string | null;
  supplier: string | null;
  booking_source: string | null;
  provider_cost: string | null;
  client_cost?: string | null;
  profit?: number | string | null;
  observations: string | null;
  room_prices?: RoomPrice[];
}

interface ServiceTransport {
  company: string;
  destination: string;
  horary: string;
  hgdl_key: string;
  supplier: string;
  booking_source: string | null;
  provider_cost: string;
  client_cost?: string | null;
  profit?: number | string | null;
  observations: string | null;
}

interface ExpedienteReservaListItem {
  id: number;
  reference_person: string | null;
  reservation_date: string;
  departure_date: string;
  return_date: string;
  reserved_seats: number;
  state: string;
  observations: string | null;
  is_archived: boolean;
  deleted_at?: string | null;
  package?: {
    name: string;
    duration?: string;
    city?: { name: string };
  };
  flight_with_trashed?: ServiceFlight | null;
  hotel_with_trashed?: ServiceHotel | null;
  transport_with_trashed?: ServiceTransport | null;
}

interface ExpedienteReservaDetail extends ExpedienteReservaListItem {
  flight?: ServiceFlight | null;
  hotel?: ServiceHotel | null;
  transport?: ServiceTransport | null;
}

interface ExpedienteResponse {
  cliente: {
    id: number;
    name: string;
    last_name?: string;
    email: string;
    phone?: string;
  };
  reservas: ExpedienteReservaListItem[];
  resumen: {
    total: number;
    activas: number;
    archivadas: number;
  };
}

function getFlight(reserva: ExpedienteReservaListItem | ExpedienteReservaDetail) {
  return (
    ("flight" in reserva && reserva.flight) ||
    reserva.flight_with_trashed ||
    null
  );
}

function getHotel(reserva: ExpedienteReservaListItem | ExpedienteReservaDetail) {
  return (
    ("hotel" in reserva && reserva.hotel) || reserva.hotel_with_trashed || null
  );
}

function getTransport(
  reserva: ExpedienteReservaListItem | ExpedienteReservaDetail,
) {
  return (
    ("transport" in reserva && reserva.transport) ||
    reserva.transport_with_trashed ||
    null
  );
}

function getInitials(name: string, lastName?: string) {
  const a = name.trim().charAt(0) || "";
  const b = lastName?.trim().charAt(0) || "";
  return (a + b).toUpperCase() || "?";
}

function ExpField({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : String(value);

  return (
    <div>
      <p className="exp-field-label">{label}</p>
      <p className="exp-field-value">{display}</p>
    </div>
  );
}

function ExpCostStrip({
  providerCost,
  clientCost,
  profit,
}: {
  providerCost?: string | number | null;
  clientCost?: string | number | null;
  profit?: number | string | null;
}) {
  const profitValue = profitFromRecord(profit, clientCost, providerCost);

  return (
    <div className="exp-cost-strip">
      <div className="exp-cost-item">
        <span className="exp-cost-item-label">Plataforma</span>
        <p className="exp-cost-item-value">{formatPrice(providerCost)}</p>
      </div>
      <div className="exp-cost-item">
        <span className="exp-cost-item-label">Agencia</span>
        <p className="exp-cost-item-value">
          {clientCost ? formatPrice(clientCost) : "—"}
        </p>
      </div>
      <div className="exp-cost-item exp-cost-item--profit">
        <span className="exp-cost-item-label">Ganancia</span>
        <p className="exp-cost-item-value">
          {profitValue !== null ? formatPrice(profitValue) : "—"}
        </p>
      </div>
    </div>
  );
}

function ReservationBreakdown({
  reserva,
}: {
  reserva: ExpedienteReservaListItem | ExpedienteReservaDetail;
}) {
  const flight = getFlight(reserva);
  const hotel = getHotel(reserva);
  const transport = getTransport(reserva);

  return (
    <div className="exp-breakdown">
      <div className="exp-overview-grid">
        <div className="exp-mini-card">
          <div className="exp-mini-card-head">
            <UserIcon size={15} />
            Reserva
          </div>
          <div className="exp-field-grid">
            <ExpField label="Contacto" value={reserva.reference_person} />
            <ExpField label="Asientos" value={reserva.reserved_seats} />
            <ExpField
              label="Reservado"
              value={formatDate(reserva.reservation_date)}
            />
            {reserva.is_archived && reserva.deleted_at && (
              <ExpField
                label="Archivada"
                value={formatDate(reserva.deleted_at)}
              />
            )}
          </div>
        </div>

        {reserva.package && (
          <div className="exp-mini-card">
            <div className="exp-mini-card-head">
              <PackageIcon size={15} />
              Paquete
            </div>
            <div className="exp-field-grid">
              <ExpField label="Nombre" value={reserva.package.name} />
              <ExpField label="Destino" value={reserva.package.city?.name} />
              <ExpField label="Duración" value={reserva.package.duration} />
            </div>
          </div>
        )}

        <div className="exp-mini-card">
          <div className="exp-mini-card-head">
            <CalendarIcon size={15} />
            Viaje
          </div>
          <div className="exp-field-grid">
            <ExpField label="Salida" value={formatDate(reserva.departure_date)} />
            <ExpField label="Regreso" value={formatDate(reserva.return_date)} />
          </div>
        </div>
      </div>

      {(flight || hotel || transport) && (
        <div className="exp-services-stack">
          {flight && (
            <div className="exp-service-card exp-service-card--flight">
              <div className="exp-service-head">
                <PlaneIcon size={17} />
                Vuelo
              </div>
              <div className="exp-service-body">
                <div className="exp-field-grid">
                  <ExpField label="Aerolínea" value={flight.airline_name} />
                  <ExpField label="Destino" value={flight.destination} />
                  <ExpField label="Horario" value={flight.flight_schedule} />
                  <ExpField label="Clave HGDL" value={flight.hgdl_key} />
                  <ExpField
                    label="Medio reservación"
                    value={flight.booking_source}
                  />
                </div>
                <ExpCostStrip
                  providerCost={flight.provider_cost}
                  clientCost={flight.client_cost}
                  profit={flight.profit}
                />
                {flight.observations?.trim() && (
                  <p className="exp-note">{flight.observations}</p>
                )}
              </div>
            </div>
          )}

          {hotel && (
            <div className="exp-service-card exp-service-card--hotel">
              <div className="exp-service-head">
                <BuildingIcon size={17} />
                Hotel
              </div>
              <div className="exp-service-body">
                <div className="exp-field-grid">
                  <ExpField label="Nombre" value={hotel.name} />
                  <ExpField label="Destino" value={hotel.destination} />
                  <ExpField label="Proveedor" value={hotel.supplier} />
                  <ExpField label="Clave HGDL" value={hotel.hgdl_key} />
                  <ExpField
                    label="Medio reservación"
                    value={hotel.booking_source}
                  />
                </div>
                {hotel.room_prices && hotel.room_prices.length > 0 && (
                  <div className="mt-3">
                    <p className="exp-field-label mb-2">Habitaciones</p>
                    {hotel.room_prices.map((room) => (
                      <div key={room.id} className="exp-room-row">
                        <span className="font-semibold text-[#193355]">
                          {OCCUPANCY_LABELS[room.occupancy_type] ??
                            room.occupancy_type}
                        </span>
                        <span>{formatPrice(room.nightly_rate)}/noche</span>
                        <span className="text-gray-500">
                          {room.total_rooms} hab.
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <ExpCostStrip
                  providerCost={hotel.provider_cost}
                  clientCost={hotel.client_cost}
                  profit={hotel.profit}
                />
                {hotel.observations?.trim() && (
                  <p className="exp-note">{hotel.observations}</p>
                )}
              </div>
            </div>
          )}

          {transport && (
            <div className="exp-service-card exp-service-card--transport">
              <div className="exp-service-head">
                <BusIcon size={17} />
                Transporte
              </div>
              <div className="exp-service-body">
                <div className="exp-field-grid">
                  <ExpField label="Empresa" value={transport.company} />
                  <ExpField label="Destino" value={transport.destination} />
                  <ExpField label="Horario" value={transport.horary} />
                  <ExpField label="Proveedor" value={transport.supplier} />
                  <ExpField label="Clave HGDL" value={transport.hgdl_key} />
                </div>
                <ExpCostStrip
                  providerCost={transport.provider_cost}
                  clientCost={transport.client_cost}
                  profit={transport.profit}
                />
                {transport.observations?.trim() && (
                  <p className="exp-note">{transport.observations}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="exp-section-block">
        <div className="exp-section-block-head">
          <Wallet size={17} className="text-[#d3a762]" />
          Finanzas
        </div>
        <div className="exp-section-block-body">
          <FinancePanel reservationId={reserva.id} />
        </div>
      </div>

      <div className="exp-section-block exp-docs-wrap">
        <div className="exp-section-block-head">
          <FileTextIcon size={17} className="text-[#d3a762]" />
          Documentos PDF
        </div>
        <div className="exp-section-block-body exp-docs-body">
          <p className="exp-docs-hint">
            Sube o reemplaza PDF por tipo (máx. 10 MB). Para cambiar un archivo,
            elimínalo y vuelve a subirlo.
          </p>
          <ReservationDocuments
            reservationId={reserva.id}
            hideTitle
            embedded
          />
        </div>
      </div>

      {reserva.observations?.trim() && (
        <div className="exp-note">
          <strong className="block text-[#193355] mb-1">
            Observaciones generales
          </strong>
          {reserva.observations}
        </div>
      )}

      <Link
        to={`/admin/reservas/detalle/${reserva.id}`}
        className="exp-footer-link"
      >
        Ver ficha completa
        <ArrowRightIcon size={15} />
      </Link>
    </div>
  );
}

function ExpedienteReservaCard({
  reserva,
  defaultOpen = false,
}: {
  reserva: ExpedienteReservaListItem;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [detail, setDetail] = useState<ExpedienteReservaDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const flight = getFlight(reserva);
  const hotel = getHotel(reserva);
  const transport = getTransport(reserva);

  const loadDetail = useCallback(async () => {
    if (detail) return;
    setLoadingDetail(true);
    try {
      const res = await api.get(`/reservations/${reserva.id}`);
      setDetail(res.data);
    } catch (err) {
      console.error("Error al cargar detalle de reserva:", err);
      setDetail(reserva);
    } finally {
      setLoadingDetail(false);
    }
  }, [detail, reserva]);

  const toggle = async () => {
    if (!open) await loadDetail();
    setOpen((prev) => !prev);
  };

  return (
    <article className={`exp-trip${open ? " exp-trip--open" : ""}`}>
      <button type="button" onClick={toggle} className="exp-trip-trigger">
        <div className="min-w-0 flex-1">
          <p className="exp-trip-id">Reserva #{reserva.id}</p>
          <h4 className="exp-trip-name">
            {reserva.package?.name ?? "Sin paquete asignado"}
          </h4>
          <p className="exp-trip-dates">
            <CalendarIcon size={14} />
            {formatDate(reserva.departure_date)} →{" "}
            {formatDate(reserva.return_date)}
          </p>
          <div className="exp-trip-badges">
            <StatusBadge state={reserva.state} />
            {reserva.is_archived && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                <ArchiveIcon size={12} />
                Archivada
              </span>
            )}
            {flight && (
              <span className="exp-service-pill exp-service-pill--flight">
                <PlaneIcon size={11} />
                Vuelo
              </span>
            )}
            {hotel && (
              <span className="exp-service-pill exp-service-pill--hotel">
                <BuildingIcon size={11} />
                Hotel
              </span>
            )}
            {transport && (
              <span className="exp-service-pill exp-service-pill--transport">
                <BusIcon size={11} />
                Transporte
              </span>
            )}
          </div>
        </div>
        <span className="exp-trip-chevron" aria-hidden="true">
          {open ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
        </span>
      </button>

      {open && (
        <div className="exp-trip-body">
          {loadingDetail ? (
            <p className="exp-loading">Cargando desglose del viaje...</p>
          ) : (
            <ReservationBreakdown reserva={detail ?? reserva} />
          )}
        </div>
      )}
    </article>
  );
}

export default function ExpedienteClienteDetalle() {
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expediente, setExpediente] = useState<ExpedienteResponse | null>(null);
  const [showArchivedOnly, setShowArchivedOnly] = useState(true);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    api
      .get(`/clientes/${userId}/expediente`)
      .then((res) => setExpediente(res.data))
      .catch((err) => {
        console.error("Error al cargar expediente:", err);
        setError("No se pudo cargar el expediente del cliente.");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const reservasFiltradas = useMemo(() => {
    if (!expediente) return [];
    if (!showArchivedOnly) return expediente.reservas;
    return expediente.reservas.filter((r) => r.is_archived);
  }, [expediente, showArchivedOnly]);

  if (loading) {
    return (
      <AdminLayout>
        <LoadingScreen icon={ArchiveIcon} text="Cargando expediente..." />
      </AdminLayout>
    );
  }

  if (error || !expediente) {
    return (
      <AdminLayout>
        <div className="exp-page exp-empty">
          <p>{error ?? "Expediente no encontrado."}</p>
          <Link
            to="/admin/reservas/archivados"
            className="exp-footer-link mt-4"
          >
            <ArrowBigLeftIcon size={16} />
            Volver a expedientes
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const { cliente, resumen } = expediente;
  const fullName = [cliente.name, cliente.last_name].filter(Boolean).join(" ");

  return (
    <AdminLayout>
      <div className="exp-page adm-list-page">
        <section className="exp-hero">
          <div className="exp-hero-top">
            <div className="exp-hero-profile">
              <div className="exp-avatar" aria-hidden="true">
                {getInitials(cliente.name, cliente.last_name)}
              </div>
              <div>
                <h1 className="exp-hero-title">{fullName}</h1>
                <p className="exp-hero-sub">Expediente del cliente</p>
                <div className="exp-contact-row">
                  <span className="exp-contact-chip">
                    <MailIcon size={13} />
                    {cliente.email}
                  </span>
                  {cliente.phone && (
                    <span className="exp-contact-chip">
                      <PhoneIcon size={13} />
                      {cliente.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="exp-stats">
              <div className="exp-stat exp-stat--archived">
                <span className="exp-stat-value">{resumen.archivadas}</span>
                <span className="exp-stat-label">Archivadas</span>
              </div>
              <div className="exp-stat exp-stat--active">
                <span className="exp-stat-value">{resumen.activas}</span>
                <span className="exp-stat-label">Activas</span>
              </div>
              <div className="exp-stat exp-stat--total">
                <span className="exp-stat-value">{resumen.total}</span>
                <span className="exp-stat-label">Totales</span>
              </div>
            </div>
          </div>
        </section>

        <section className="exp-panel">
          <div className="exp-panel-head">
            <h2 className="exp-panel-title">Desglose por viaje</h2>
            <label className="exp-filter-toggle">
              <input
                type="checkbox"
                checked={showArchivedOnly}
                onChange={(e) => setShowArchivedOnly(e.target.checked)}
              />
              Solo reservas archivadas
            </label>
          </div>

          {reservasFiltradas.length === 0 ? (
            <div className="exp-empty">
              <p className="font-medium text-[#64748b]">
                {showArchivedOnly
                  ? "Este cliente no tiene reservas archivadas."
                  : "Este cliente no tiene reservas registradas."}
              </p>
            </div>
          ) : (
            <div className="exp-trip-list">
              {reservasFiltradas.map((reserva, index) => (
                <ExpedienteReservaCard
                  key={reserva.id}
                  reserva={reserva}
                  defaultOpen={index === 0}
                />
              ))}
            </div>
          )}
        </section>

        <div className="exp-back-bar">
          <Link
            to="/admin/reservas/archivados"
            className="R-button-f inline-flex items-center gap-2"
          >
            <ArrowBigLeftIcon size={18} />
            Regresar a expedientes
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
