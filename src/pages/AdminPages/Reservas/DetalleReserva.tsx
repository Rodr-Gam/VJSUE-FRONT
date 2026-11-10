import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../../api";

import AdminLayout from "../../../layouts/AdminLayout";
import {
  NotebookPenIcon,
  UserIcon,
  PlaneIcon,
  BuildingIcon,
  BusIcon,
  CalendarIcon,
  PackageIcon,
  ArrowBigLeftIcon,
  Wallet,
  PencilIcon,
  FileDown,
} from "lucide-react";
import LoadingScreen from "../../../components/Admin/LoadingScreen";
import FinancePanel from "../../../components/Admin/finance/FinancePanel";
import Toast from "../../../components/common/Toast";
import { useToast } from "../../../hooks/useToast";
import { financeService } from "../../../financeService";
import { generateReservationPdf } from "../../../utils/generateReservationPdf";
import type { Passenger } from "../../../types/passenger";
import {
  SectionCard,
  InfoRow,
  StatusBadge,
} from "../../../components/common/DetailBlocks";
import {
  formatDate,
  formatPrice,
  OCCUPANCY_LABELS,
} from "../../../utils/format";
import { profitFromRecord } from "../../../utils/serviceProfit";

import "../../../styles/AdminReservationDetail.css";

interface RoomPrice {
  id: number;
  occupancy_type: "single" | "double" | "triple" | "quadruple" | "suite";
  nightly_rate: string;
  total_rooms: number;
}

interface Reservation {
  id: number;
  reference_person: string | null;
  reservation_date: string;
  departure_date: string;
  return_date: string;
  reserved_seats: number;
  adults?: number;
  juniors?: number;
  children?: number;
  unit_price_adult?: string | number;
  unit_price_junior?: string | number;
  unit_price_child?: string | number;
  state: "pending" | "confirmed" | "canceled" | "finished";
  observations: string | null;
  passengers?: Passenger[];

  user?: {
    name: string;
    last_name?: string;
    email?: string;
  };

  package?: {
    name: string;
    description?: string;
    duration?: string;
    price_adult?: string;
    price_junior?: string;
    price_child?: string;
    status?: "active" | "inactive";
    city?: {
      name: string;
    };
  };

  flight?: {
    airline_name: string;
    destination: string;
    flight_schedule: string;
    hgdl_key: string;
    booking_source: string | null;
    provider_cost: string;
    client_cost?: string | null;
    profit?: number | string | null;
    observations: string | null;
  };

  hotel?: {
    name: string;
    destination: string;
    check_in_out?: string | null;
    hgdl_key: string | null;
    supplier: string | null;
    booking_source: string | null;
    provider_cost: string | null;
    client_cost?: string | null;
    profit?: number | string | null;
    observations: string | null;
    room_prices?: RoomPrice[];
  };

  transport?: {
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
  };
}

function clientDisplayName(user?: Reservation["user"]) {
  if (!user) return "—";
  return [user.name, user.last_name].filter(Boolean).join(" ");
}

function profitRow(
  profit: number | string | null | undefined,
  clientCost: string | null | undefined,
  providerCost: string | null | undefined,
) {
  const value = profitFromRecord(profit, clientCost, providerCost);
  return value !== null ? formatPrice(value) : "—";
}

export default function DetReserva() {
  const { id } = useParams();
  const { mensaje, mostrarMensaje } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    setLoadingData(true);

    api
      .get(`/reservations/${id}`)
      .then((res) => {
        setReservation(res.data);
      })
      .catch(console.error)
      .finally(() => {
        setLoadingData(false);
      });
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!id || pdfLoading) return;
    setPdfLoading(true);
    try {
      const reservationId = Number(id);
      const [resRes, account] = await Promise.all([
        api.get<Reservation>(`/reservations/${reservationId}`),
        financeService.getAccountByReservation(reservationId),
      ]);
      generateReservationPdf(
        resRes.data as Parameters<typeof generateReservationPdf>[0],
        account,
      );
      mostrarMensaje("PDF descargado.", "success");
    } catch (err) {
      console.error(err);
      mostrarMensaje("No se pudo generar el PDF.", "error");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loadingData) {
    return (
      <AdminLayout>
        <LoadingScreen icon={NotebookPenIcon} text="Cargando reserva..." />
      </AdminLayout>
    );
  }

  if (!reservation) {
    return (
      <AdminLayout>
        <div className="adm-list-page">
          <p className="adm-empty">No se encontró la reserva.</p>
          <Link to="/admin/ver-reserva" className="adm-res-detail-action-link">
            <ArrowBigLeftIcon size={16} />
            Volver al listado
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const packageLine = [
    reservation.package?.name,
    reservation.package?.city?.name,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <AdminLayout>
      <div className="adm-list-page adm-res-detail-page">
        <Link to="/admin/ver-reserva" className="adm-account-back">
          <ArrowBigLeftIcon size={18} aria-hidden="true" />
          Volver a reservas
        </Link>

        <header className="adm-res-detail-hero">
          <div className="adm-res-detail-hero-text">
            <p className="adm-res-detail-kicker">Detalle de reserva</p>
            <h1 className="adm-res-detail-title">
              Reserva #{reservation.id}
            </h1>
            <p className="adm-res-detail-sub">
              {packageLine || "Sin paquete asignado"}
            </p>
          </div>
          <StatusBadge state={reservation.state} />
        </header>

        <div className="adm-res-detail-actions">
          <Link
            to={`/admin/reservas/${reservation.id}`}
            className="adm-res-detail-action-link adm-res-detail-action-link--primary"
          >
            <PencilIcon size={16} />
            Editar reserva
          </Link>
          <button
            type="button"
            className="adm-res-detail-action-link"
            disabled={pdfLoading}
            onClick={handleDownloadPdf}
          >
            <FileDown size={16} />
            {pdfLoading ? "Generando PDF…" : "Descargar PDF"}
          </button>
        </div>

        <div className="adm-res-detail-stats">
          <div className="adm-res-detail-stat">
            <p className="adm-res-detail-stat-label">Cliente</p>
            <p className="adm-res-detail-stat-value">
              {clientDisplayName(reservation.user)}
            </p>
          </div>
          <div className="adm-res-detail-stat">
            <p className="adm-res-detail-stat-label">Salida</p>
            <p className="adm-res-detail-stat-value">
              {formatDate(reservation.departure_date)}
            </p>
          </div>
          <div className="adm-res-detail-stat">
            <p className="adm-res-detail-stat-label">Regreso</p>
            <p className="adm-res-detail-stat-value">
              {formatDate(reservation.return_date)}
            </p>
          </div>
          <div className="adm-res-detail-stat">
            <p className="adm-res-detail-stat-label">Asientos</p>
            <p className="adm-res-detail-stat-value">
              {reservation.reserved_seats}
            </p>
          </div>
        </div>

        <div className="adm-res-detail-grid">
          <SectionCard icon={UserIcon} title="Cliente y reserva">
            <InfoRow label="Cliente" value={clientDisplayName(reservation.user)} />
            <InfoRow
              label="Email"
              value={reservation.user?.email}
              variant="muted"
            />
            <InfoRow
              label="Persona de contacto"
              value={reservation.reference_person}
            />
            <InfoRow
              label="Fecha de reservación"
              value={formatDate(reservation.reservation_date)}
            />
          </SectionCard>

          {reservation.package && (
            <SectionCard icon={PackageIcon} title="Paquete">
              <InfoRow label="Nombre" value={reservation.package.name} />
              <InfoRow
                label="Destino"
                value={reservation.package.city?.name}
              />
              <InfoRow label="Duración" value={reservation.package.duration} />
              <InfoRow
                label="Precio adulto"
                value={formatPrice(reservation.package.price_adult)}
              />
              <InfoRow
                label="Precio juvenil"
                value={formatPrice(reservation.package.price_junior)}
              />
              <InfoRow
                label="Precio menor"
                value={formatPrice(reservation.package.price_child)}
              />
            </SectionCard>
          )}

          <SectionCard icon={CalendarIcon} title="Fechas del viaje">
            <InfoRow
              label="Salida"
              value={formatDate(reservation.departure_date)}
            />
            <InfoRow
              label="Regreso"
              value={formatDate(reservation.return_date)}
            />
          </SectionCard>

          {reservation.flight && (
            <SectionCard icon={PlaneIcon} title="Vuelo">
              <InfoRow
                label="Aerolínea"
                value={reservation.flight.airline_name}
              />
              <InfoRow label="Destino" value={reservation.flight.destination} />
              <InfoRow
                label="Horario"
                value={reservation.flight.flight_schedule}
              />
              <InfoRow label="Clave HGDL" value={reservation.flight.hgdl_key} />
              <InfoRow
                label="Medio de reservación"
                value={reservation.flight.booking_source}
              />
              <InfoRow
                label="Costo proveedor"
                value={formatPrice(reservation.flight.provider_cost)}
              />
              <InfoRow
                label="Costo de agencia"
                value={
                  reservation.flight.client_cost
                    ? formatPrice(reservation.flight.client_cost)
                    : "—"
                }
              />
              <InfoRow
                label="Ganancia"
                variant="profit"
                value={profitRow(
                  reservation.flight.profit,
                  reservation.flight.client_cost,
                  reservation.flight.provider_cost,
                )}
              />
            </SectionCard>
          )}

          {reservation.hotel && (
            <SectionCard icon={BuildingIcon} title="Hotel">
              <InfoRow label="Nombre" value={reservation.hotel.name} />
              <InfoRow label="Destino" value={reservation.hotel.destination} />
              <InfoRow label="Proveedor" value={reservation.hotel.supplier} />
              <InfoRow label="Clave HGDL" value={reservation.hotel.hgdl_key} />
              <InfoRow
                label="Medio de reservación"
                value={reservation.hotel.booking_source}
              />
              <InfoRow
                label="Costo proveedor"
                value={formatPrice(reservation.hotel.provider_cost)}
              />
              <InfoRow
                label="Costo de agencia"
                value={
                  reservation.hotel.client_cost
                    ? formatPrice(reservation.hotel.client_cost)
                    : "—"
                }
              />
              <InfoRow
                label="Ganancia"
                variant="profit"
                value={profitRow(
                  reservation.hotel.profit,
                  reservation.hotel.client_cost,
                  reservation.hotel.provider_cost,
                )}
              />

              {reservation.hotel.room_prices &&
                reservation.hotel.room_prices.length > 0 && (
                  <div className="adm-detail-span-full">
                    <p className="adm-detail-field-label">Tipos de habitación</p>
                    <div className="adm-res-detail-rooms">
                      {reservation.hotel.room_prices.map((room) => (
                        <div key={room.id} className="adm-res-detail-room-row">
                          <span className="font-semibold text-slate-700">
                            {OCCUPANCY_LABELS[room.occupancy_type] ??
                              room.occupancy_type}
                          </span>
                          <span>{formatPrice(room.nightly_rate)}/noche</span>
                          <span className="text-slate-500">
                            {room.total_rooms} hab.
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </SectionCard>
          )}

          {reservation.transport && (
            <SectionCard icon={BusIcon} title="Transporte">
              <InfoRow label="Empresa" value={reservation.transport.company} />
              <InfoRow
                label="Destino"
                value={reservation.transport.destination}
              />
              <InfoRow label="Horario" value={reservation.transport.horary} />
              <InfoRow
                label="Proveedor"
                value={reservation.transport.supplier}
              />
              <InfoRow
                label="Clave HGDL"
                value={reservation.transport.hgdl_key}
              />
              <InfoRow
                label="Costo proveedor"
                value={formatPrice(reservation.transport.provider_cost)}
              />
              <InfoRow
                label="Costo de agencia"
                value={
                  reservation.transport.client_cost
                    ? formatPrice(reservation.transport.client_cost)
                    : "—"
                }
              />
              <InfoRow
                label="Ganancia"
                variant="profit"
                value={profitRow(
                  reservation.transport.profit,
                  reservation.transport.client_cost,
                  reservation.transport.provider_cost,
                )}
              />
            </SectionCard>
          )}

          <SectionCard icon={Wallet} title="Finanzas" fullWidth>
            <div className="adm-detail-span-full">
              <FinancePanel reservationId={reservation.id} />
            </div>
          </SectionCard>

          {reservation.observations?.trim() && (
            <div className="adm-res-detail-notes">
              <p className="adm-res-detail-notes-label">Observaciones</p>
              <p className="adm-res-detail-notes-text">
                {reservation.observations}
              </p>
            </div>
          )}
        </div>
      </div>
      <Toast mensaje={mensaje} />
    </AdminLayout>
  );
}
