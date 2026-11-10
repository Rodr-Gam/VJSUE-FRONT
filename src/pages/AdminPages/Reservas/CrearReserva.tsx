import { useState, useEffect } from "react";
import { api } from "../../../api";
import AdminLayout from "../../../layouts/AdminLayout";
import "../../../styles/VerReserva.css";
import { SaveAllIcon, BookMarkedIcon } from "lucide-react";
import { toDateInputValue } from "../../../utils/packageDates";
import PackageAutocomplete from "../../../components/reservations/PackageAutocomplete";
import type { PackageOption } from "../../../components/reservations/PackageAutocomplete";
import PassengerFields from "../../../components/reservations/PassengerFields";
import { usePackagePassengers } from "../../../hooks/usePackagePassengers";
import { validateReservationSeats } from "../../../utils/reservationValidation";
import { parseReservationApiError } from "../../../utils/reservationErrors";

interface Package extends PackageOption {
  departure_date: string;
  return_date: string;
  stock: number;
  price_adult: number;
  price_junior: number;
  price_child: number;
}

interface User {
  id: number;
  name: string;
  last_name: string;
  email: string;
  state: "active" | "inactive" | "banned";
}

export default function CrearReserva() {
  // Usuario
  const [userResults, setUserResults] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | "">("");

  // Paquetes y form
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<number | "">("");
  const [packageSearch, setPackageSearch] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  // Pasajeros
  const [reservedPlace, setReservedPlace] = useState(0);
  const [adults, setAdults] = useState(0);
  const [juniors, setJuniors] = useState(0);
  const [children, setChildren] = useState(0);

  const [stateReser, setStateReser] = useState("pending");
  const [observation, setObservation] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "success" | "error";
  } | null>(null);

  const counts = { adults, juniors, children };

  const {
    selectedPkgObj,
    isPrivatePackage,
    prices,
    totalPassengers,
    previewTotal,
    stockReal,
    seatsUsed,
    maxFor,
  } = usePackagePassengers({
    packages,
    packageId: selectedPackage,
    counts,
    reservedSeats: reservedPlace,
  });

  const cargarPaquetes = async () => {
    try {
      const response = await api.get("/packages", {
        params: { bookable_only: true },
      });
      setPackages(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!userSearch || userSearch.length < 2) {
      setUserResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await api.get("/users", {
          params: { search: userSearch, state: "active", per_page: 25 },
        });
        const list = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];
        const activos = list.filter((u: User) => u.state === "active");
        setUserResults(activos);
      } catch (error) {
        console.error(error);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [userSearch]);

  useEffect(() => {
    cargarPaquetes();
  }, []);

  const resetPassengers = () => {
    setReservedPlace(0);
    setAdults(0);
    setJuniors(0);
    setChildren(0);
  };

  const handleSelectPackage = (pkg: PackageOption) => {
    const fullPkg = packages.find((p) => p.id === pkg.id);
    setSelectedPackage(pkg.id);
    setPackageSearch(pkg.name);
    if (fullPkg) {
      setDepartureDate(toDateInputValue(fullPkg.departure_date));
      setReturnDate(toDateInputValue(fullPkg.return_date));
    }
    resetPassengers();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errorValidacion = validateReservationSeats({
      hasPackage: !!selectedPkgObj,
      isPrivatePackage,
      seatsUsed,
      stockReal,
      totalPassengers,
      departureDate,
      returnDate,
    });
    if (errorValidacion) {
      setMensaje({ texto: errorValidacion, tipo: "error" });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/reservations", {
        user_id: selectedUser,
        package_id: selectedPackage,
        reference_person: reference.trim(),
        reservation_date: date,
        departure_date: departureDate,
        return_date: returnDate,
        ...(isPrivatePackage
          ? { adults, juniors, children }
          : { reserved_seats: reservedPlace }),
        state: stateReser,
        observations: observation.trim(),
      });

      setMensaje({ texto: "Reserva creada con éxito.", tipo: "success" });

      setSelectedUser("");
      setUserSearch("");
      setUserResults([]);
      setShowDropdown(false);

      setSelectedPackage("");
      setPackageSearch("");

      setReference("");
      setDate("");
      setDepartureDate("");
      setReturnDate("");
      resetPassengers();
      setStateReser("pending");
      setObservation("");

      cargarPaquetes();

      console.log("Reserva creada:", response.data);
    } catch (error: unknown) {
      setMensaje({
        texto: parseReservationApiError(error),
        tipo: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="R-dashboard-cards">
        <div className="flex-1">
          <div className="R-card-tt">
            <h2 className="R-dashboard-title text-[#d3a762]">
              Crear reservación
            </h2>
          </div>
          <div className="R-card-f">
            <div className="flex items-center gap-2 mb-4">
              <BookMarkedIcon size={24} className="text-[#d3a762]" />
              <h3 className="text-lg font-bold text-black">Crea una nueva</h3>
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
                    setSelectedPackage("");
                  }}
                  onSelect={handleSelectPackage}
                />

                {/* Cliente con autocompletado */}
                <label className="R-label" style={{ position: "relative" }}>
                  Cliente
                  <input
                    type="text"
                    className="R-input"
                    placeholder="Buscar por nombre o email..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setSelectedUser("");
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  />
                  {showDropdown && userSearch.length >= 2 && (
                    <ul
                      style={{
                        position: "absolute",
                        width: "100%",
                        zIndex: 50,
                      }}
                      className="border border-gray-200 rounded-md bg-white shadow max-h-48 overflow-y-auto"
                    >
                      {searching ? (
                        <li className="px-3 py-2 text-gray-400 text-sm">
                          Buscando...
                        </li>
                      ) : userResults.length > 0 ? (
                        userResults.map((user) => (
                          <li
                            key={user.id}
                            className="px-3 py-2 hover:bg-[#d3a762]/10 cursor-pointer text-sm"
                            onMouseDown={() => {
                              setSelectedUser(user.id);
                              setUserSearch(`${user.name} ${user.last_name} ${user.email ? `— ${user.email}` : "— sin correo"}`);
                              setShowDropdown(false);
                            }}
                          >
                            {user.name} {user.last_name} {user.email ? `— ${user.email}` : "— sin correo"}
                          </li>
                        ))
                      ) : (
                        <li className="px-3 py-2 text-gray-400 text-sm">
                          Sin resultados
                        </li>
                      )}
                    </ul>
                  )}
                </label>

                <label className="R-label">
                  Referencia
                  <input
                    type="text"
                    title="Nombre del referente o recomendador."
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="R-input"
                    placeholder="Ej. Chicas de Whatsapp"
                  />
                </label>
                <label className="R-label">
                  Fecha de Reserva
                  <input
                    required
                    title="Registre la fecha en la que la reservación se realizó."
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="R-input"
                  />
                </label>
                <label className="R-label">
                  Salida del viaje
                  <input
                    required
                    readOnly
                    title="Se asigna automáticamente según el paquete elegido."
                    type="date"
                    value={departureDate}
                    className="R-input bg-gray-300 cursor-not-allowed"
                  />
                </label>
                <label className="R-label">
                  Regreso del viaje
                  <input
                    required
                    readOnly
                    title="Se asigna automáticamente según el paquete elegido."
                    type="date"
                    value={returnDate}
                    className="R-input bg-gray-300 cursor-not-allowed"
                  />
                </label>
                <label className="R-label">
                  Estado
                  <select
                    required
                    title="Seleccione el estado actual de la reservación."
                    className="R-select"
                    value={stateReser}
                    onChange={(e) => setStateReser(e.target.value)}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="paid">Pagada</option>
                    <option value="finished">Completada</option>
                    <option value="canceled">Cancelada</option>
                  </select>
                </label>
                <label className="R-label">
                  Observaciones
                  <textarea
                    value={observation}
                    rows={1}
                    className="R-textarea"
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Observaciones adicionales sobre la reserva"
                  />
                </label>
              </div>

              <div className="R-card-f">
                <PassengerFields
                  isPrivatePackage={!!isPrivatePackage}
                  counts={counts}
                  prices={prices}
                  maxFor={maxFor}
                  maxSeats={stockReal}
                  onAdultsChange={setAdults}
                  onJuniorsChange={setJuniors}
                  onChildrenChange={setChildren}
                  reservedSeats={reservedPlace}
                  onReservedSeatsChange={setReservedPlace}
                  previewTotal={previewTotal}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="R-button-f flex items-center gap-2 h-18 justify-center"
                  disabled={!selectedPackage || !selectedUser || loading}
                >
                  <SaveAllIcon size={18} />
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
