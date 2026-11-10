import { api } from "../../../api";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import {
  NotebookPenIcon,
  RefreshCcwIcon,
  ArrowBigLeftIcon,
} from "lucide-react";
import AdminLayout from "../../../layouts/AdminLayout";
import ReservationDocuments from "../../../components/Admin/ReservationDocuments";
import FinancePanel from "../../../components/Admin/finance/FinancePanel";
import "../../../styles/VerReserva.css";
import {
  toDateInputValue,
  resolveReservationReturnDate,
  resolvePackageReturnDate,
} from "../../../utils/packageDates";
import PackageAutocomplete from "../../../components/reservations/PackageAutocomplete";
import type { PackageOption } from "../../../components/reservations/PackageAutocomplete";
import PassengerFields from "../../../components/reservations/PassengerFields";
import { usePackagePassengers } from "../../../hooks/usePackagePassengers";
import { validateReservationSeats } from "../../../utils/reservationValidation";

interface Reservation {
  user?: { name: string };
  package_id: number;
  reference_person: string;
  reservation_date: string;
  departure_date: string;
  return_date: string;
  state: string;
  reserved_seats: number;
  adults: number;
  juniors: number;
  children: number;
  observations: string;
}

interface Package extends PackageOption {
  departure_date: string;
  return_date: string;
  stock: number;
  price_adult: number;
  price_junior: number;
  price_child: number;
}

const EMPTY_RESERVATION: Reservation = {
  package_id: 0,
  reference_person: "",
  reservation_date: "",
  departure_date: "",
  return_date: "",
  state: "",
  reserved_seats: 0,
  adults: 0,
  juniors: 0,
  children: 0,
  observations: "",
};

export default function EditarReserva() {
  const nav = useNavigate();
  const { id } = useParams();
  const [packageSearch, setPackageSearch] = useState("");
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [reservation, setReservation] =
    useState<Reservation>(EMPTY_RESERVATION);
  const [originalReservation, setOriginalReservation] = useState<{
    package_id: number;
    reserved_seats: number;
  } | null>(null);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "success" | "error";
  } | null>(null);

  const counts = {
    adults: reservation.adults,
    juniors: reservation.juniors,
    children: reservation.children,
  };

  // Si el paquete no cambió respecto al original, le devolvemos a stockReal
  // los lugares que esta misma reserva ya tenía ocupados. reserved_seats
  // YA ES el total (adults + juniors + children) calculado por el backend,
  // así que no hay que sumarlo aparte — eso era el bug de doble conteo.
  const mismoPackage =
    originalReservation?.package_id === reservation.package_id;
  const reservedCapacity =
    originalReservation && mismoPackage
      ? originalReservation.reserved_seats
      : 0;

  const {
    selectedPkgObj,
    prices,
    totalPassengers,
    previewTotal,
    stockReal,
    maxFor,
  } = usePackagePassengers({
    packages,
    packageId: reservation.package_id,
    counts,
    reservedSeats: reservation.reserved_seats,
    reservedCapacity,
  });

  const cargarReserva = async () => {
    try {
      const response = await api.get(`/reservations/${id}`);
      const data = response.data;

      setReservation({
        user: data.user,
        package_id: data.package_id,
        reference_person: data.reference_person,
        reservation_date: toDateInputValue(data.reservation_date),
        departure_date: toDateInputValue(data.departure_date),
        return_date: resolveReservationReturnDate(data) ?? "",
        state: data.state,
        reserved_seats: data.reserved_seats ?? 0,
        // Si la reserva no tiene desglose (legacy), la tratamos como
        // todos adultos, igual que hace normalizePassengers() en el backend.
        adults: data.adults ?? data.reserved_seats ?? 0,
        juniors: data.juniors ?? 0,
        children: data.children ?? 0,
        observations: data.observations,
      });
      setOriginalReservation({
        package_id: data.package_id,
        reserved_seats: data.reserved_seats ?? 0,
      });
    } catch (error) {
      console.error("Error al cargar la reserva:", error);
    }
  };

  const cargarPaquetes = async () => {
    try {
      const response = await api.get("/packages");
      setPackages(response.data);
    } catch (error) {
      console.error("Error al cargar paquetes:", error);
    }
  };

  useEffect(() => {
    cargarReserva();
    cargarPaquetes();
  }, []);

  useEffect(() => {
    if (!reservation.package_id || packages.length === 0) return;
    const pkg = packages.find((p) => p.id === reservation.package_id);
    if (pkg) setPackageSearch(pkg.name);
  }, [reservation.package_id, packages]);

  const handleSelectPackage = (pkg: PackageOption) => {
    const fullPkg = packages.find((p) => p.id === pkg.id);
    setReservation({
      ...reservation,
      package_id: pkg.id,
      departure_date: fullPkg ? toDateInputValue(fullPkg.departure_date) : "",
      return_date: fullPkg ? resolvePackageReturnDate(fullPkg) : "",
      // Reseteamos pasajeros al cambiar de paquete: el stock y los
      // precios del paquete nuevo no tienen relación con los del anterior.
      reserved_seats: 0,
      adults: 0,
      juniors: 0,
      children: 0,
    });
    setPackageSearch(pkg.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // El desglose de pasajeros siempre está visible al editar, así que
    // la validación siempre usa totalPassengers, sin importar el tipo
    // de paquete.
    const errorValidacion = validateReservationSeats({
      hasPackage: !!selectedPkgObj,
      isPrivatePackage: true,
      seatsUsed: totalPassengers,
      stockReal,
      totalPassengers,
      departureDate: reservation.departure_date,
      returnDate: reservation.return_date,
    });
    if (errorValidacion) {
      setMensaje({ texto: errorValidacion, tipo: "error" });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        package_id: reservation.package_id,
        reference_person: reservation.reference_person,
        reservation_date: reservation.reservation_date,
        departure_date: reservation.departure_date,
        return_date: reservation.return_date,
        state: reservation.state,
        observations: reservation.observations,
        // Siempre mandamos el desglose completo, sin importar si el
        // paquete es público o privado — el precio siempre depende
        // de la mezcla real de adultos/juniors/niños.
        adults: reservation.adults,
        juniors: reservation.juniors,
        children: reservation.children,
      };

      await api.put(`/reservations/${id}`, payload);

      setMensaje({ texto: "Reserva actualizada con éxito.", tipo: "success" });

      setTimeout(() => {
        nav("/admin/ver-reserva");
      }, 1500);
    } catch (error) {
      console.error("Error al actualizar la reserva:", error);
      setMensaje({ texto: "Error al actualizar la reserva.", tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="R-dashboard-cards">
        <div className="flex-1">
          <div className="R-card-tt">
            <h2 className="R-dashboard-title text-[#d3a762]">Editar Reserva</h2>
          </div>

          <div className="R-card-f">
            <div className="flex items-center gap-2 mb-4">
              <NotebookPenIcon size={24} className="text-[#d3a762]" />
              <h3 className="text-lg font-bold text-black">
                Detalles de la Reserva
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                <PackageAutocomplete
                  packages={packages}
                  search={packageSearch}
                  onSearchChange={(v) => {
                    setPackageSearch(v);
                    setReservation({
                      ...reservation,
                      package_id: 0,
                      departure_date: "",
                      return_date: "",
                    });
                  }}
                  onSelect={handleSelectPackage}
                />

                <label className="R-label flex-1">
                  Cliente
                  <input
                    title="No es posible la edición"
                    type="text"
                    disabled
                    readOnly
                    className="R-input bg-gray-300"
                    value={reservation.user?.name}
                  />
                </label>
                <label className="R-label flex-1">
                  Referencia
                  <input
                    type="text"
                    className="R-input"
                    value={reservation.reference_person}
                    onChange={(e) =>
                      setReservation({
                        ...reservation,
                        reference_person: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="R-label">
                  Fecha de reserva
                  <input
                    required
                    type="date"
                    className="R-input"
                    value={reservation.reservation_date}
                    onChange={(e) =>
                      setReservation({
                        ...reservation,
                        reservation_date: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="R-label">
                  Salida del viaje
                  <input
                    required
                    type="date"
                    className="R-input bg-gray-300 cursor-not-allowed"
                    readOnly
                    value={reservation.departure_date}
                  />
                </label>
                <label className="R-label">
                  Regreso del viaje
                  <input
                    required
                    type="date"
                    className="R-input bg-gray-300 cursor-not-allowed"
                    readOnly
                    value={reservation.return_date}
                  />
                </label>
                <label className="R-label">
                  Estado
                  <select
                    className="R-select"
                    required
                    value={reservation.state}
                    onChange={(e) =>
                      setReservation({ ...reservation, state: e.target.value })
                    }
                  >
                    <option value="pending">Pendiente</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="canceled">Cancelada</option>
                    <option value="finished">Completa</option>
                    <option value="paid">Pagada</option>
                  </select>
                </label>
                <label className="R-label">
                  Observaciones
                  <textarea
                    className="R-textarea"
                    rows={1}
                    value={reservation.observations}
                    onChange={(e) =>
                      setReservation({
                        ...reservation,
                        observations: e.target.value,
                      })
                    }
                  ></textarea>
                </label>
              </div>

              <div className="R-card-f">
                {/* El desglose de pasajeros siempre está visible al editar,
                    sin importar si el paquete es público o privado. */}
                <PassengerFields
                  isPrivatePackage={true}
                  counts={counts}
                  prices={prices}
                  maxFor={maxFor}
                  onAdultsChange={(v) =>
                    setReservation({ ...reservation, adults: v })
                  }
                  onJuniorsChange={(v) =>
                    setReservation({ ...reservation, juniors: v })
                  }
                  onChildrenChange={(v) =>
                    setReservation({ ...reservation, children: v })
                  }
                  reservedSeats={reservation.reserved_seats}
                  onReservedSeatsChange={(v) =>
                    setReservation({ ...reservation, reserved_seats: v })
                  }
                  previewTotal={previewTotal}
                />
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/ver-reserva`}
                  className="R-button-f flex items-center gap-2 h-18 justify-center"
                >
                  <ArrowBigLeftIcon size={18} />
                  <span>Regresar</span>
                </Link>
                <button
                  type="submit"
                  className="R-button-f flex items-center gap-2 h-18 justify-center"
                  disabled={!reservation.package_id || loading}
                >
                  <RefreshCcwIcon size={18} />
                  {loading ? "Actualizando..." : "Actualizar"}
                </button>
              </div>
            </form>
          </div>

          {id && (
            <div className="R-card-f mt-4">
              <FinancePanel reservationId={Number(id)} />
            </div>
          )}

          {id && (
            <div className="R-card-f mt-4">
              <ReservationDocuments reservationId={Number(id)} />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
