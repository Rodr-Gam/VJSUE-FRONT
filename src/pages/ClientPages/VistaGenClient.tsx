import { useMemo, useState, useEffect } from "react";

import { Link } from "react-router-dom";

import { reservationService } from "../../reservationService";

import { useAuth } from "../../hooks/useAuth";

import NavPrivClient from "../../components/privadasCliente/NavPrivClient";

import ReservaSkeleton from "../../components/ReservaSkeleton";

import {

  PlaneTakeoffIcon,

  BusIcon,

  HotelIcon,

  ArrowRight,

  UserRound,

  History,

  CalendarClock,

  Wallet,
} from "lucide-react";

import type { Reservation } from "../../types/reservation";

import type { ReservationTripTab } from "../../utils/reservationTripFilter";

import "../../styles/GenCliente.css";

import { resolveReservationReturnDate } from "../../utils/packageDates";

import {

  formatMXN,

  formatPassengerSummary,

  getReservationPassengerCounts,

} from "../../utils/reservationPricing";

import { shouldShowHgdlKey } from "../../utils/reservationStatus";
import { getHotelCheckInOutLabel, getHotelDestinationLabel } from "../../utils/reservationServices";

import PassengerProgress from "../../components/passengers/PassengerProgress";

import { getPassengerDataBadge } from "../../utils/passengerProgress";

import { splitReservationsByTripDate } from "../../utils/reservationTripFilter";



const STATE_MAP: Record<string, { cls: string; label: string }> = {

  confirmada: { cls: "bp-status--confirmed", label: "Confirmada" },

  confirmed: { cls: "bp-status--confirmed", label: "Confirmada" },

  pendiente: { cls: "bp-status--pending", label: "Pendiente" },

  pending: { cls: "bp-status--pending", label: "Pendiente" },

  cancelada: { cls: "bp-status--cancelled", label: "Cancelada" },

  cancelled: { cls: "bp-status--cancelled", label: "Cancelada" },

  canceled: { cls: "bp-status--cancelled", label: "Cancelada" },

  paid: { cls: "bp-status--paid", label: "Pagada" },

  pagado: { cls: "bp-status--paid", label: "Pagada" },

  pagada: { cls: "bp-status--paid", label: "Pagada" },

  finished: { cls: "bp-status--confirmed", label: "Finalizada" },

  finalizada: { cls: "bp-status--confirmed", label: "Finalizada" },

};



function getStatusInfo(state: string) {

  const key = (state ?? "").toLowerCase();

  return STATE_MAP[key] ?? { cls: "bp-status--pending", label: state ?? "—" };

}



function formatFecha(fecha: string) {

  return new Date(fecha).toLocaleDateString("es-MX", {

    day: "numeric",

    month: "short",

    year: "numeric",

  });

}



function hasValue(value?: string | null) {

  return Boolean(value?.trim());

}



function ReservationCard({ reserva }: { reserva: Reservation }) {

  const { cls: statusCls, label: statusLabel } = getStatusInfo(reserva.state);

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

  const flightAssigned = hasValue(reserva.flight?.airline_name);

  const transportAssigned = hasValue(reserva.transport?.company);

  const hotelAssigned = hasValue(reserva.hotel?.name);



  return (

    <article key={reserva.id} className="bp">

      <div className="bp-body">

        <div className="bp-top">

          <div className="bp-top-main">

            <h2 className="bp-destination">

              {reserva.package?.city?.name ?? "Destino"}

            </h2>

            <p className="bp-package">

              {reserva.package?.name ?? "Paquete turístico"}

            </p>

          </div>

          <div className="bp-status-col">

            <span className={`bp-status ${statusCls}`}>{statusLabel}</span>

            {getPassengerDataBadge(reserva) && (

              <span className="bp-data-hint">

                {getPassengerDataBadge(reserva)}

              </span>

            )}

          </div>

        </div>



        <div className="bp-meta">

          <div className="bp-meta-chip">

            <span className="bp-meta-label">Pasajeros</span>

            <span className="bp-meta-value">

              {formatPassengerSummary(passengers)}

            </span>

          </div>

          <div className="bp-meta-chip">

            <span className="bp-meta-label">Lugares</span>

            <span className="bp-meta-value">{reserva.reserved_seats}</span>

          </div>

          {reserva.total_amount != null && (

            <div className="bp-meta-chip bp-meta-chip--highlight">

              <span className="bp-meta-label">Total</span>

              <span className="bp-meta-value">

                {formatMXN(Number(reserva.total_amount))}

              </span>

            </div>

          )}

        </div>



        <div className="bp-services">

          <div

            className={`bp-service${flightAssigned ? "" : " bp-service--pending"}`}

          >

            <span className="bp-service-icon">

              <PlaneTakeoffIcon size={15} />

            </span>

            <div className="bp-service-text">

              <span className="bp-service-title">

                {reserva.flight?.airline_name ?? "Aerolínea sin asignar"}

              </span>

              <span className="bp-service-sub">

                {reserva.flight?.flight_schedule ??

                  "Itinerario de vuelo pendiente"}

              </span>

              {showFlightKey && (

                <span className="bp-service-key">

                  Clave: <strong>{reserva.flight!.hgdl_key}</strong>

                </span>

              )}

            </div>

          </div>



          <div

            className={`bp-service${transportAssigned ? "" : " bp-service--pending"}`}

          >

            <span className="bp-service-icon">

              <BusIcon size={15} />

            </span>

            <div className="bp-service-text">

              <span className="bp-service-title">

                {reserva.transport?.company ?? "Transporte sin asignar"}

              </span>

              <span className="bp-service-sub">

                {reserva.transport?.horary ??

                  "Itinerario de autobús pendiente"}

              </span>

              {showTransportKey && (

                <span className="bp-service-key">

                  Clave: <strong>{reserva.transport!.hgdl_key}</strong>

                </span>

              )}

            </div>

          </div>



          <div

            className={`bp-service${hotelAssigned ? "" : " bp-service--pending"}`}

          >

            <span className="bp-service-icon">

              <HotelIcon size={15} />

            </span>

            <div className="bp-service-text">

              <span className="bp-service-title">

                {reserva.hotel?.name ?? "Hotel sin asignar"}

              </span>

              <span className="bp-service-sub">
                {getHotelCheckInOutLabel(reserva.hotel)}
              </span>

              {getHotelDestinationLabel(reserva.hotel) && (
                <span className="bp-service-sub bp-service-sub--muted">
                  {getHotelDestinationLabel(reserva.hotel)}
                </span>
              )}

              {showHotelKey && (

                <span className="bp-service-key">

                  Clave: <strong>{reserva.hotel!.hgdl_key}</strong>

                </span>

              )}

            </div>

          </div>

        </div>



        <PassengerProgress reservation={reserva} variant="compact" />



        <div className="bp-actions">

          <Link

            to={`/cliente/detalle/${reserva.id}`}

            className="bp-cta bp-cta--outline"

          >

            Ver detalles

            <ArrowRight size={14} className="bp-cta-icon" />

          </Link>

          <Link

            to={`/cliente/reservas/${reserva.id}/pasajeros`}

            className="bp-cta"

          >

            <UserRound size={14} aria-hidden="true" />

            Datos de pasajeros

          </Link>

          {reserva.state !== "canceled" && reserva.state !== "cancelada" && (

            <Link

              to={`/cliente/detalle/${reserva.id}#comprobantes`}

              className="bp-cta bp-cta--gold"

            >

              <Wallet size={14} aria-hidden="true" />

              Pagos y abonos

            </Link>

          )}

        </div>

      </div>



      <div className="bp-divider" aria-hidden="true" />



      <aside className="bp-coupon">

        <div className="bp-date-block">

          <p className="bp-date-label">Salida</p>

          <p className="bp-date-value">

            {formatFecha(reserva.departure_date)}

          </p>

        </div>



        <div className="bp-coupon-sep" />



        <div className="bp-date-block">

          <p className="bp-date-label">Regreso</p>

          <p className="bp-date-value">

            {(() => {

              const returnDate = resolveReservationReturnDate(reserva);

              return returnDate ? formatFecha(returnDate) : "—";

            })()}

          </p>

        </div>



        {reserva.package?.duration && (

          <>

            <div className="bp-coupon-sep" />

            <div className="bp-duration">

              <span className="bp-duration-label">Duración</span>

              <span className="bp-duration-value">

                {reserva.package.duration}

              </span>

            </div>

          </>

        )}

      </aside>

    </article>

  );

}



export default function GenCliente() {

  const { user } = useAuth();

  const [reservas, setReservas] = useState<Reservation[]>([]);

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<ReservationTripTab>("upcoming");



  useEffect(() => {

    reservationService

      .getMyReservations()

      .then(setReservas)

      .catch((err) => console.error("Error al cargar reservas:", err))

      .finally(() => setLoading(false));

  }, []);



  const { upcoming, history } = useMemo(

    () => splitReservationsByTripDate(reservas),

    [reservas],

  );



  const visibleReservas = activeTab === "history" ? history : upcoming;

  const firstName = user?.name?.split(" ")[0] ?? user?.name ?? "";



  return (

    <>

      <NavPrivClient />



      <main className="gc-page">

        <div className="gc-container">

          <header className="gc-header">

            <div className="gc-header-text">

              <p className="gc-eyebrow">Dashboard</p>

              <h1 className="gc-greeting">
                ¡Hola, <span>{firstName}</span>!
              </h1>

              <p className="gc-subtitle">

                Consulta tus próximos viajes o revisa tu historial de

                aventuras.

              </p>

            </div>



            {!loading && reservas.length > 0 && (

              <div className="gc-stat-pill" aria-label={`${reservas.length} reservas`}>

                <span className="gc-stat-num">{visibleReservas.length}</span>

                <span className="gc-stat-label">

                  {activeTab === "history" ? "En historial" : "Próximos"}

                </span>

              </div>

            )}

          </header>



          {!loading && reservas.length > 0 && (

            <div

              className="gc-tabs"

              role="tablist"

              aria-label="Filtrar reservas por fecha"

            >

              <button

                type="button"

                role="tab"

                id="tab-upcoming"

                aria-selected={activeTab === "upcoming"}

                aria-controls="panel-upcoming"

                className={`gc-tab${activeTab === "upcoming" ? " gc-tab--active" : ""}`}

                onClick={() => setActiveTab("upcoming")}

              >

                <CalendarClock size={16} aria-hidden="true" />

                Próximos viajes

                <span className="gc-tab-count">{upcoming.length}</span>

              </button>

              <button

                type="button"

                role="tab"

                id="tab-history"

                aria-selected={activeTab === "history"}

                aria-controls="panel-history"

                className={`gc-tab${activeTab === "history" ? " gc-tab--active" : ""}`}

                onClick={() => setActiveTab("history")}

              >

                <History size={16} aria-hidden="true" />

                Historial

                <span className="gc-tab-count">{history.length}</span>

              </button>

            </div>

          )}



          {loading && (

            <div className="gc-list">

              <ReservaSkeleton />

              <ReservaSkeleton />

            </div>

          )}



          {!loading && reservas.length === 0 && (

            <div className="gc-empty">

              <div className="gc-empty-icon" aria-hidden="true">
                <PlaneTakeoffIcon size={32} />
              </div>

              <h2 className="gc-empty-title">Aún no tienes reservas</h2>

              <p className="gc-empty-text">

                Explora nuestros paquetes y planea tu próximo viaje con nosotros.

              </p>

              <Link to="/paquetes-disponibles" className="gc-empty-cta">

                Ver paquetes disponibles

                <ArrowRight size={16} />

              </Link>

            </div>

          )}



          {!loading && reservas.length > 0 && visibleReservas.length === 0 && (

            <div className="gc-empty gc-empty--tab">

              <div className="gc-empty-icon" aria-hidden="true">

                {activeTab === "history" ? "🗂️" : "🧳"}

              </div>

              <h2 className="gc-empty-title">

                {activeTab === "history"

                  ? "Sin viajes en el historial"

                  : "No tienes viajes próximos"}

              </h2>

              <p className="gc-empty-text">

                {activeTab === "history"

                  ? "Los viajes cuyo regreso fue hace más de 6 días aparecerán aquí."

                  : "Tus reservas activas, en curso o recientes se muestran en esta pestaña."}

              </p>

              {activeTab === "upcoming" && history.length > 0 && (

                <button

                  type="button"

                  className="gc-empty-cta gc-empty-cta--ghost"

                  onClick={() => setActiveTab("history")}

                >

                  Ver historial ({history.length})

                </button>

              )}

              {activeTab === "history" && upcoming.length > 0 && (

                <button

                  type="button"

                  className="gc-empty-cta gc-empty-cta--ghost"

                  onClick={() => setActiveTab("upcoming")}

                >

                  Ver próximos viajes ({upcoming.length})

                </button>

              )}

            </div>

          )}



          {!loading && visibleReservas.length > 0 && (

            <div

              className="gc-list"

              role="tabpanel"

              id={activeTab === "history" ? "panel-history" : "panel-upcoming"}

              aria-labelledby={

                activeTab === "history" ? "tab-history" : "tab-upcoming"

              }

            >

              {visibleReservas.map((reserva) => (

                <ReservationCard key={reserva.id} reserva={reserva} />

              ))}

            </div>

          )}

        </div>

      </main>

    </>

  );

}


