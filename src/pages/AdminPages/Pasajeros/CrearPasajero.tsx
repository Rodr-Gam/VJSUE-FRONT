import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, UserPlus, Users } from "lucide-react";
import { api } from "../../../api";
import AdminLayout from "../../../layouts/AdminLayout";
import PassengerForm from "../../../components/passengers/PassengerForm";
import PassengerList from "../../../components/passengers/PassengerList";
import PassengerProgress from "../../../components/passengers/PassengerProgress";
import { passengerService } from "../../../passengerService";
import type { Passenger } from "../../../types/passenger";
import type { Reservation } from "../../../types/reservation";
import { unwrapReservationList } from "../../../utils/apiHelpers";
import { parsePassengerApiError } from "../../../utils/passengerErrors";
import {
  canManagePassengers,
  getPassengerDataBadge,
  passengerProgress,
} from "../../../utils/passengerProgress";
import { getReservationStateLabel } from "../../../utils/reservationStatus";
import "../../../styles/VerReserva.css";
import "../../../styles/Passengers.css";

interface ReservationOption {
  id: number;
  reference_person?: string;
  state: string;
  departure_date?: string;
  reserved_seats?: number;
  user?: { name?: string; email?: string };
  package?: { name?: string; city?: { name?: string } };
}

export default function CrearPasajero() {
  const [searchParams] = useSearchParams();
  const preselectedId = Number(searchParams.get("reserva") || "");

  const [reservations, setReservations] = useState<ReservationOption[]>([]);
  const [reservationSearch, setReservationSearch] = useState("");
  const [selectedReservationId, setSelectedReservationId] = useState<number | "">(
    Number.isFinite(preselectedId) && preselectedId > 0 ? preselectedId : "",
  );
  const [reserva, setReserva] = useState<Reservation | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingReservation, setLoadingReservation] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "success" | "error";
  } | null>(null);

  useEffect(() => {
    api
      .get("/reservations", { params: { per_page: 100 } })
      .then((res) => {
        const list = unwrapReservationList<ReservationOption>(res.data);
        setReservations(list.filter((item) => item.state !== "canceled"));
      })
      .catch(() => setReservations([]))
      .finally(() => setLoadingList(false));
  }, []);

  const filteredReservations = useMemo(() => {
    const term = reservationSearch.trim().toLowerCase();
    if (!term) return reservations.slice(0, 12);

    return reservations
      .filter((item) => {
        const label = [
          item.id,
          item.user?.name,
          item.user?.email,
          item.reference_person,
          item.package?.name,
          item.package?.city?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return label.includes(term);
      })
      .slice(0, 12);
  }, [reservationSearch, reservations]);

  const loadReservation = useCallback(async (reservationId: number) => {
    setLoadingReservation(true);
    setMensaje(null);

    try {
      const { data } = await api.get<Reservation>(`/reservations/${reservationId}`);
      if (!data.passengers) {
        data.passengers = await passengerService.getPassengers(reservationId, "admin");
      }
      setReserva(data);
    } catch {
      setReserva(null);
      setMensaje({
        texto: "No se pudo cargar la reserva seleccionada.",
        tipo: "error",
      });
    } finally {
      setLoadingReservation(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedReservationId) {
      setReserva(null);
      return;
    }
    loadReservation(Number(selectedReservationId));
  }, [selectedReservationId, loadReservation]);

  const handleSelectReservation = (reservationId: number) => {
    setSelectedReservationId(reservationId);
    setShowForm(false);
    setEditingPassenger(null);
    setReservationSearch("");
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingPassenger(null);
    setMensaje({
      texto: editingPassenger
        ? "Pasajero actualizado correctamente."
        : "Pasajero registrado correctamente.",
      tipo: "success",
    });
    if (selectedReservationId) {
      await loadReservation(Number(selectedReservationId));
    }
  };

  const handleDelete = async (passenger: Passenger) => {
    if (!reserva) return;
    const confirmed = window.confirm(
      `¿Eliminar a ${passenger.name} ${passenger.last_name} de esta reserva?`,
    );
    if (!confirmed) return;

    try {
      setDeletingId(passenger.id);
      await passengerService.deletePassenger(reserva.id, passenger.id, "admin");
      setMensaje({ texto: "Pasajero eliminado.", tipo: "success" });
      await loadReservation(reserva.id);
    } catch (err) {
      setMensaje({ texto: parsePassengerApiError(err), tipo: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const progress = reserva ? passengerProgress(reserva) : null;
  const canEdit = reserva ? canManagePassengers(reserva.state) : false;

  return (
    <AdminLayout>
      <div className="R-dashboard-cards">
        <div className="flex-1">
          <div className="R-card-tt">
            <h2 className="R-dashboard-title text-[#d3a762]">Registrar pasajero</h2>
          </div>

          <div className="R-card-f">
            <div className="flex items-center gap-2 mb-4">
              <Users size={24} className="text-[#d3a762]" />
              <h3 className="text-lg font-bold text-black">
                Selecciona la reserva y agrega pasajeros
              </h3>
            </div>

            {mensaje && (
              <div className={`cc-alert cc-alert--${mensaje.tipo}`}>
                <span className="cc-alert-icon">
                  {mensaje.tipo === "success" ? "✓" : "!"}
                </span>
                <span>{mensaje.texto}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
              <label className="R-label lg:col-span-2">
                Buscar reserva
                <input
                  type="text"
                  className="R-input"
                  placeholder="Buscar por #, cliente, referencia o paquete..."
                  value={reservationSearch}
                  onChange={(e) => setReservationSearch(e.target.value)}
                />
              </label>

              {loadingList ? (
                <p className="text-sm text-gray-500 lg:col-span-2">
                  Cargando reservas...
                </p>
              ) : filteredReservations.length === 0 ? (
                <p className="text-sm text-gray-500 lg:col-span-2">
                  No hay reservas disponibles con ese criterio.
                </p>
              ) : (
                <div className="lg:col-span-2 flex flex-col gap-2 max-h-56 overflow-y-auto">
                  {filteredReservations.map((item) => {
                    const active = selectedReservationId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectReservation(item.id)}
                        className={`text-left rounded-lg border px-3 py-2 transition ${
                          active
                            ? "border-[#d3a762] bg-[#fff8eb]"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <p className="font-semibold text-sm text-[#193355]">
                          Reserva #{item.id} · {item.package?.name || "Sin paquete"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.user?.name || item.reference_person || "Sin cliente"} ·{" "}
                          {item.package?.city?.name || "Sin destino"} ·{" "}
                          {getReservationStateLabel(item.state)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {loadingReservation && selectedReservationId && (
            <div className="R-card-f mt-4">
              <p className="text-sm text-gray-500 p-4">Cargando datos de la reserva...</p>
            </div>
          )}

          {reserva && !loadingReservation && (
            <>
              <div className="R-card-f mt-4">
                <div className="p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Reserva seleccionada
                  </p>
                  <h4 className="text-xl font-semibold text-[#193355]">
                    #{reserva.id} · {reserva.package?.name ?? "Paquete"}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {reserva.package?.city?.name ?? "Destino"} · Estado:{" "}
                    {getReservationStateLabel(reserva.state)}
                    {getPassengerDataBadge(reserva) && (
                      <> · {getPassengerDataBadge(reserva)}</>
                    )}
                  </p>
                  <Link
                    to={`/admin/reservas/${reserva.id}`}
                    className="inline-block mt-3 text-sm font-semibold text-[#d3a762] hover:underline"
                  >
                    Ver / editar reserva →
                  </Link>
                </div>
              </div>

              <div className="R-card-f mt-4 pg-card">
                <PassengerProgress reservation={reserva} />
              </div>

              {canEdit && progress?.hasSlotsAvailable && !showForm && (
                <button
                  type="button"
                  className="R-button-f flex items-center gap-2 mt-4"
                  onClick={() => {
                    setEditingPassenger(null);
                    setShowForm(true);
                  }}
                >
                  <Plus size={18} />
                  Agregar pasajero
                </button>
              )}

              {canEdit && showForm && (
                <div className="R-card-f mt-4 pg-card">
                  <PassengerForm
                    reservation={reserva}
                    initial={editingPassenger}
                    onSuccess={handleFormSuccess}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingPassenger(null);
                    }}
                    apiMode="admin"
                  />
                </div>
              )}

              {!canEdit && (
                <div className="pg-alert pg-alert--info mt-4">
                  Esta reserva está cancelada. No puedes modificar los pasajeros.
                </div>
              )}

              <div className="R-card-f mt-4 pg-card">
                <div className="pg-list-header p-4 pb-0">
                  <h2 className="pg-section-title">
                    <UserPlus size={16} aria-hidden="true" />
                    Pasajeros registrados ({reserva.passengers?.length ?? 0})
                  </h2>
                </div>
                <div className="p-4 pt-2">
                  <PassengerList
                    passengers={reserva.passengers ?? []}
                    canEdit={canEdit}
                    onEdit={(passenger) => {
                      setEditingPassenger(passenger);
                      setShowForm(true);
                    }}
                    onDelete={handleDelete}
                    deletingId={deletingId}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
