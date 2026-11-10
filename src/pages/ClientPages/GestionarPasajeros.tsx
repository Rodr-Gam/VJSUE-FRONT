import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, UserPlus } from "lucide-react";
import NavPrivClient from "../../components/privadasCliente/NavPrivClient";
import PassengerForm from "../../components/passengers/PassengerForm";
import PassengerList from "../../components/passengers/PassengerList";
import PassengerProgress from "../../components/passengers/PassengerProgress";
import { passengerService } from "../../passengerService";
import { reservationService } from "../../reservationService";
import type { Reservation } from "../../types/reservation";
import {
  canManagePassengers,
  getPassengerDataBadge,
  passengerProgress,
} from "../../utils/passengerProgress";
import { getReservationStateLabel } from "../../utils/reservationStatus";
import "../../styles/Cliente.css";
import "../../styles/Passengers.css";

const PASSENGER_CONTACT_NOTICE =
  "Si deseas modificar o eliminar los datos de un pasajero registrado, favor de comunicarte con nosotros.";

export default function GestionarPasajeros() {
  const { id } = useParams();
  const reservationId = Number(id);

  const [reserva, setReserva] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadReservation = useCallback(async () => {
    if (!reservationId) return;

    try {
      setError(null);
      const data = await reservationService.getMyReservationById(reservationId);

      if (!data.passengers) {
        try {
          data.passengers = await passengerService.getPassengers(reservationId);
        } catch {
          data.passengers = [];
        }
      }

      setReserva(data);
    } catch {
      setError("No pudimos cargar la reserva.");
      setReserva(null);
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    loadReservation();
  }, [loadReservation]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleFormSuccess = async () => {
    setShowForm(false);
    setToast("Pasajero registrado correctamente.");
    setLoading(true);
    await loadReservation();
    setLoading(false);
  };

  const openAddForm = () => {
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  if (loading && !reserva) {
    return (
      <>
        <NavPrivClient />
        <main className="pg-page">
          <div className="pg-container">
            <p className="pg-loading">Cargando...</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !reserva) {
    return (
      <>
        <NavPrivClient />
        <main className="pg-page">
          <div className="pg-container pg-container--empty">
            <p className="pg-error">{error ?? "Reserva no encontrada."}</p>
            <Link to="/cliente/dashboard" className="pg-btn pg-btn--primary">
              Volver a mis reservas
            </Link>
          </div>
        </main>
      </>
    );
  }

  const progress = passengerProgress(reserva);
  const canAdd = canManagePassengers(reserva.state);
  const dataBadge = getPassengerDataBadge(reserva);
  const passengers = reserva.passengers ?? [];

  return (
    <>
      <NavPrivClient />
      <main className="pg-page">
        <div className="pg-container">
          <Link to="/cliente/dashboard" className="dr-back-link">
            <ArrowLeft size={16} aria-hidden="true" />
            Mis reservas
          </Link>

          <header className="pg-header">
            <div>
              <p className="pg-eyebrow">Datos de pasajeros</p>
              <h1 className="pg-title">
                {reserva.package?.city?.name ?? "Tu reserva"}
              </h1>
              <p className="pg-subtitle">
                {reserva.package?.name ?? "Paquete turístico"} · Estado:{" "}
                {getReservationStateLabel(reserva.state)}
              </p>
              {dataBadge && (
                <span className="pg-data-badge">{dataBadge}</span>
              )}
            </div>
            <Link
              to={`/cliente/detalle/${reserva.id}`}
              className="pg-link-detail"
            >
              Ver detalle completo
            </Link>
          </header>

          {toast && <div className="pg-toast">{toast}</div>}

          <div className="pg-card">
            <PassengerProgress reservation={reserva} />
          </div>

          {canAdd && progress.hasSlotsAvailable && !showForm && (
            <button
              type="button"
              className="pg-btn pg-btn--primary pg-add-btn"
              onClick={openAddForm}
            >
              <Plus size={18} aria-hidden="true" />
              Agregar pasajero
            </button>
          )}

          {canAdd && showForm && (
            <div className="pg-card">
              <PassengerForm
                reservation={reserva}
                onSuccess={handleFormSuccess}
                onCancel={closeForm}
              />
            </div>
          )}

          {!canAdd && (
            <div className="pg-alert pg-alert--info">
              Esta reserva está cancelada. No puedes modificar los pasajeros.
            </div>
          )}

          <div className="pg-card">
            <div className="pg-list-header">
              <h2 className="pg-section-title">
                <UserPlus size={16} aria-hidden="true" />
                Pasajeros registrados ({passengers.length})
              </h2>
            </div>
            <PassengerList passengers={passengers} />
            {passengers.length > 0 && (
              <p className="pg-contact-notice">{PASSENGER_CONTACT_NOTICE}</p>
            )}
          </div>

          <p className="pg-footnote">
            Puedes completar los datos ahora o regresar más tarde. Tu reserva
            permanece activa aunque falten pasajeros por registrar.
          </p>

          <div className="pg-footer-actions">
            <Link
              to={`/cliente/detalle/${reserva.id}`}
              className="pg-btn pg-btn--ghost"
            >
              Ver detalle de reserva
            </Link>
            <Link to="/cliente/dashboard" className="pg-btn pg-btn--primary">
              Ir al dashboard
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
