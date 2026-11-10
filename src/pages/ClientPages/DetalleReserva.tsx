import { useState, useEffect, type ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import NavPrivClient from "../../components/privadasCliente/NavPrivClient";
import { reservationService } from "../../reservationService";
import type { Reservation } from "../../types/reservation";
import "../../styles/Cliente.css";
import { resolveReservationReturnDate } from "../../utils/packageDates";
import {
  formatMXN,
  formatPassengerSummary,
  getReservationPassengerCounts,
  buildServiceCostLines,
  computeReservationDisplayTotal,
} from "../../utils/reservationPricing";
import { getHotelCheckInOutLabel, getHotelDestinationLabel } from "../../utils/reservationServices";
import {
  getReservationStateLabel,
  isReservationPaid,
  shouldShowHgdlKey,
} from "../../utils/reservationStatus";
import {
  ArrowLeft,
  Bus,
  CalendarDays,
  Hotel,
  MapPin,
  Package,
  PlaneTakeoff,
  Users,
  KeyRound,
  UserRound,
} from "lucide-react";
import PassengerProgress from "../../components/passengers/PassengerProgress";
import ClientReservationFinance from "../../components/cliente/ClientReservationFinance";
import type { Account } from "../../types/finance";
import {
  canManagePassengers,
  getPassengerDataBadge,
  passengerProgress,
} from "../../utils/passengerProgress";

function getStatusClass(state: string): string {
  const key = (state ?? "").toLowerCase();
  if (isReservationPaid(state)) return "dr-status dr-status--paid";
  if (["confirmed", "confirmada", "finished", "finalizada"].includes(key)) {
    return "dr-status dr-status--confirmed";
  }
  if (["canceled", "cancelled", "cancelada"].includes(key)) {
    return "dr-status dr-status--cancelled";
  }
  return "dr-status dr-status--pending";
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(value: string | number | undefined) {
  if (value == null || value === "—") return "—";
  if (typeof value === "number") return formatMXN(value);
  const num = Number(value);
  return Number.isFinite(num) ? formatMXN(num) : `$${value}`;
}

interface ServiceBlockProps {
  icon: ReactNode;
  title: string;
  assigned: boolean;
  primary?: string;
  secondary?: string;
  tertiary?: string;
  showKey?: boolean;
  keyValue?: string;
  keyLabel?: string;
  keyHint?: string;
}

function ServiceBlock({
  icon,
  title,
  assigned,
  primary,
  secondary,
  tertiary,
  showKey,
  keyValue,
  keyLabel,
  keyHint,
}: ServiceBlockProps) {
  return (
    <div className={`dr-service${assigned ? "" : " dr-service--pending"}`}>
      <div className="dr-service-head">
        <span className="dr-service-icon">{icon}</span>
        <div className="dr-service-info">
          <span className="dr-service-name">{title}</span>
          {assigned ? (
            <>
              <span className="dr-service-primary">{primary}</span>
              {secondary && (
                <span className="dr-service-secondary">{secondary}</span>
              )}
              {tertiary && (
                <span className="dr-service-tertiary">{tertiary}</span>
              )}
            </>
          ) : (
            <span className="dr-service-pending">Pendiente de asignación</span>
          )}
        </div>
      </div>
      {showKey && keyValue && (
        <div className="dr-key-box dr-key-box--inline">
          <div className="dr-key-box-head">
            <KeyRound size={14} aria-hidden="true" />
            <span className="dr-key-label">{keyLabel}</span>
          </div>
          <span className="dr-key-value">{keyValue}</span>
          {keyHint && <p className="dr-key-hint">{keyHint}</p>}
        </div>
      )}
    </div>
  );
}

function DetalleSkeleton() {
  return (
    <div className="dr-skeleton" aria-hidden="true">
      <div className="dr-skeleton-hero" />
      <div className="dr-skeleton-strip" />
      <div className="dr-skeleton-card" />
      <div className="dr-skeleton-card" />
    </div>
  );
}

export default function DetalleReserva() {
  const { id } = useParams();
  const [reserva, setReserva] = useState<Reservation | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingFinance, setLoadingFinance] = useState(true);

  useEffect(() => {
    if (!id) return;

    const reservationId = Number(id);

    reservationService
      .getMyReservationById(reservationId)
      .then((data) => {
        setReserva(data);
        const embedded = reservationService.extractEmbeddedAccount(data);
        if (embedded) setAccount(embedded);
      })
      .catch((error) => console.error("Error al cargar detalle:", error))
      .finally(() => setLoading(false));

    reservationService
      .getMyReservationAccount(reservationId)
      .then((data) => {
        if (data) setAccount(data);
      })
      .catch((error) => console.error("Error al cargar abonos:", error))
      .finally(() => setLoadingFinance(false));
  }, [id]);

  useEffect(() => {
    if (loadingFinance) return;
    if (window.location.hash !== "#comprobantes") return;

    const target = document.getElementById("comprobantes");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loadingFinance]);

  if (loading) {
    return (
      <>
        <NavPrivClient />
        <main className="dr-page">
          <div className="dr-container">
            <DetalleSkeleton />
          </div>
        </main>
      </>
    );
  }

  if (!reserva) {
    return (
      <>
        <NavPrivClient />
        <main className="dr-page">
          <div className="dr-container dr-container--empty">
            <p className="dr-empty">Reserva no encontrada.</p>
            <Link to="/cliente/dashboard" className="Bback-detalle">
              <ArrowLeft size={16} />
              Volver a mis reservas
            </Link>
          </div>
        </main>
      </>
    );
  }

  const passengers = getReservationPassengerCounts(reserva);
  const showFlightKey = shouldShowHgdlKey(
    reserva.state,
    reserva.flight?.hgdl_key,
  );
  const showTransportKey = shouldShowHgdlKey(
    reserva.state,
    reserva.transport?.hgdl_key,
  );
  const showHotelKey = shouldShowHgdlKey(reserva.state, reserva.hotel?.hgdl_key);
  const unitAdult =
    reserva.unit_price_adult ?? reserva.package?.price_adult ?? "—";
  const unitJunior =
    reserva.unit_price_junior ?? reserva.package?.price_junior ?? "—";
  const unitChild =
    reserva.unit_price_child ?? reserva.package?.price_child ?? "—";
  const returnDate = resolveReservationReturnDate(reserva);
  const flightAssigned = Boolean(reserva.flight?.airline_name?.trim());
  const transportAssigned = Boolean(reserva.transport?.company?.trim());
  const hotelAssigned = Boolean(reserva.hotel?.name?.trim());
  const dataBadge = getPassengerDataBadge(reserva);
  const progress = passengerProgress(reserva);
  const serviceCostLines = buildServiceCostLines(reserva);
  const displayTotal = computeReservationDisplayTotal(reserva);

  return (
    <>
      <NavPrivClient />
      <main className="dr-page">
        <div className="dr-container">
          <Link to="/cliente/dashboard" className="dr-back-link">
            <ArrowLeft size={16} aria-hidden="true" />
            Mis reservas
          </Link>

          <header className="dr-hero">
            <div className="dr-hero-content">
              <p className="dr-eyebrow">Detalle de reserva</p>
              <h1 className="dr-hero-title">
                {reserva.package?.city?.name ?? "Tu destino"}
              </h1>
              <p className="dr-hero-package">
                <Package size={14} aria-hidden="true" />
                {reserva.package?.name ?? "Paquete turístico"}
              </p>
            </div>
            <div className="dr-hero-status">
              <span className={getStatusClass(reserva.state)}>
                {getReservationStateLabel(reserva.state)}
              </span>
              {dataBadge && <span className="dr-data-badge">{dataBadge}</span>}
            </div>
          </header>

          <div className="dr-summary-strip">
            <div className="dr-summary-item">
              <CalendarDays size={16} aria-hidden="true" />
              <div>
                <span className="dr-summary-label">Salida</span>
                <span className="dr-summary-value">
                  {formatFecha(reserva.departure_date)}
                </span>
              </div>
            </div>
            <div className="dr-summary-item">
              <CalendarDays size={16} aria-hidden="true" />
              <div>
                <span className="dr-summary-label">Regreso</span>
                <span className="dr-summary-value">
                  {returnDate ? formatFecha(returnDate) : "—"}
                </span>
              </div>
            </div>
            <div className="dr-summary-item">
              <Users size={16} aria-hidden="true" />
              <div>
                <span className="dr-summary-label">Pasajeros</span>
                <span className="dr-summary-value">
                  {formatPassengerSummary(passengers)}
                </span>
              </div>
            </div>
            <div className="dr-summary-item">
              <MapPin size={16} aria-hidden="true" />
              <div>
                <span className="dr-summary-label">Lugares</span>
                <span className="dr-summary-value">
                  {reserva.reserved_seats}
                </span>
              </div>
            </div>
          </div>

          <div className="dr-card">
            <div className="dr-passenger-head">
              <h2 className="dr-section-title">Datos de pasajeros</h2>
              <Link
                to={`/cliente/reservas/${reserva.id}/pasajeros`}
                className="dr-passenger-link"
              >
                <UserRound size={14} aria-hidden="true" />
                {canManagePassengers(reserva.state)
                  ? progress.isComplete
                    ? "Ver / editar pasajeros"
                    : "Completar pasajeros"
                  : "Ver pasajeros"}
              </Link>
            </div>
            <PassengerProgress reservation={reserva} />
          </div>

          <div className="dr-card">
            <h2 className="dr-section-title">Desglose de precios</h2>
            <ul className="dr-price-list">
              <li>
                <span>
                  Adultos
                  <em>{passengers.adults}</em>
                </span>
                <span>{formatPrice(unitAdult)} c/u</span>
              </li>
              <li>
                <span>
                  Juvenil
                  <em>{passengers.juniors}</em>
                </span>
                <span>{formatPrice(unitJunior)} c/u</span>
              </li>
              <li>
                <span>
                  Infantes
                  <em>{passengers.children}</em>
                </span>
                <span>{formatPrice(unitChild)} c/u</span>
              </li>
              {serviceCostLines.map((line) => (
                <li key={line.label}>
                  <span>{line.label}</span>
                  <span>{formatMXN(line.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="dr-total-box">
              <span className="dr-total-label">Total de la reserva</span>
              <span className="dr-total-value">{formatMXN(displayTotal)}</span>
            </div>
          </div>

          <ClientReservationFinance
            reservationId={reserva.id}
            account={account}
            loading={loadingFinance}
            reservationTotal={displayTotal}
            reservationState={reserva.state}
            reservation={reserva}
          />

          <div className="dr-card">
            <h2 className="dr-section-title">Servicios del viaje</h2>
            <div className="dr-services">
              <ServiceBlock
                icon={<PlaneTakeoff size={18} />}
                title="Vuelo"
                assigned={flightAssigned}
                primary={reserva.flight?.airline_name}
                secondary={reserva.flight?.flight_schedule}
                showKey={showFlightKey}
                keyValue={reserva.flight?.hgdl_key}
                keyLabel="Clave de vuelo (HGDL)"
                keyHint="Guarda esta clave para tu check-in o consulta con la aerolínea."
              />
              <ServiceBlock
                icon={<Bus size={18} />}
                title="Transporte"
                assigned={transportAssigned}
                primary={reserva.transport?.company}
                secondary={reserva.transport?.horary}
                showKey={showTransportKey}
                keyValue={reserva.transport?.hgdl_key}
                keyLabel="Clave de transporte (HGDL)"
                keyHint="Presenta esta clave al abordar el transporte asignado."
              />
              <ServiceBlock
                icon={<Hotel size={18} />}
                title="Hotel"
                assigned={hotelAssigned}
                primary={reserva.hotel?.name}
                secondary={getHotelCheckInOutLabel(reserva.hotel)}
                tertiary={getHotelDestinationLabel(reserva.hotel)}
                showKey={showHotelKey}
                keyValue={reserva.hotel?.hgdl_key}
                keyLabel="Clave de hotel (HGDL)"
                keyHint="Usa esta clave para tu check-in en el hotel."
              />
            </div>
          </div>

          {reserva.observations && (
            <div className="dr-card dr-card--notes">
              <h2 className="dr-section-title">Observaciones</h2>
              <p className="dr-notes">{reserva.observations}</p>
            </div>
          )}

          <Link to="/cliente/dashboard" className="Bback-detalle">
            <ArrowLeft size={16} aria-hidden="true" />
            Regresar al dashboard
          </Link>
        </div>
      </main>
    </>
  );
}
