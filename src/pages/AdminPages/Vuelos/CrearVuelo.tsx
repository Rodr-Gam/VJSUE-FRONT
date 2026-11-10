import { useState, useEffect } from "react";
import { api } from "../../../api";
import Select from "react-select";
import "../../../styles/VerReserva.css";
import { SaveAllIcon, BookMarkedIcon } from "lucide-react";
import AdminLayout from "../../../layouts/AdminLayout";
import AgencyCostInput from "../../../components/Admin/AgencyCostInput";
import { normalizeClientCost } from "../../../utils/serviceProfit";

interface Reservation {
  id: number;
  state: string;
  user?: {
    name: string;
  };
  package?: {
    name: string;
    city?: {
      name: string;
    };
  };
}

interface SelectOption {
  value: number;
  label: string;
}

export default function CrearVuelo() {
  
  //buscador
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationOptions, setReservationOptions] = useState<SelectOption[]>(
    [],
  );
  const [selectedReservation, setSelectedReservation] =
    useState<SelectOption | null>(null);

  //datos
  const [airlineName, setAirlineName] = useState("");
  const [destination, setDestination] = useState("");
  const [flightSchedule, setFlightSchedule] = useState("");
  const [hgdlKey, setHgdlKey] = useState("");
  const [bookingSource, setBookingSource] = useState("");
  const [provideCost, setProvideCost] = useState<string>("");
  const [clientCost, setClientCost] = useState<string>("");
  const [observations, setObservations] = useState("");

  //mensajes
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "success" | "error";
  } | null>(null);

  const loadReservations = () => {
    api
      .get(`/reservations?without_flight=true`)
      .then((res) => {
        const filtered: Reservation[] = res.data.data.filter(
          (r: Reservation) => r.state !== "canceled",
        );

        setReservations(filtered);

        const options = filtered.map((r) => ({
          value: r.id,
          label: `#${r.id} — ${r.user?.name} | ${r.package?.name}`,
        }));

        setReservationOptions(options);
      })
      .catch((error) => {
        console.error("Error al cargar reservaciones:", error);
      });
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReservation) {
      setMensaje({ texto: "Selecciona una reservación.", tipo: "error" });
      return;
    }
    if (!airlineName.trim()) {
      setMensaje({
        texto: "El nombre de la aerolínea es requerido.",
        tipo: "error",
      });
      return;
    }

    const costAsNumber = parseFloat(provideCost);
    if (!provideCost || isNaN(costAsNumber) || costAsNumber < 0) {
      setMensaje({ texto: "El costo debe ser mayor a 0.", tipo: "error" });
      return;
    }

    try {
      setLoading(true);
      await api.post("/flights", {
        reservation_id: selectedReservation.value,
        airline_name: airlineName.trim(),
        destination: destination.trim(),
        flight_schedule: flightSchedule.trim(),
        hgdl_key: hgdlKey.trim(),
        booking_source: bookingSource.trim(),
        provider_cost: provideCost,
        client_cost: normalizeClientCost(clientCost),
        observations: observations.trim(),
      });

      setMensaje({ texto: "Vuelo creado con éxito.", tipo: "success" });

      setSelectedReservation(null);
      setAirlineName("");
      setDestination("");
      setFlightSchedule("");
      setHgdlKey("");
      setBookingSource("");
      setProvideCost("");
      setClientCost("");
      setObservations("");
      loadReservations();

      //console.log("Vuelo creado:", response);
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(", ")
          : null) ||
        "Error al crear el vuelo.";
      setMensaje({ texto: msg, tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="R-dashboard-cards">
        <div className="flex-1">
          <div className="R-card-tt">
            <h2 className="R-dashboard-title text-[#d3a762]">Nuevo vuelo</h2>
          </div>
          <div className="R-card-f">

            <div className="flex items-center gap-2 mb-4">
              <BookMarkedIcon size={24} className="text-[#d3a762]" />
              <h3 className="text-lg font-bold text-black">
                Crea un nuevo registro de vuelo
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
                <label className="R-label">
                  Reservación
                  <Select
                    options={reservationOptions}
                    value={selectedReservation}
                    onChange={(selected) => {
                      setMensaje(null);
                      setSelectedReservation(selected);

                      const reserva = reservations.find(
                        (r) => r.id === selected?.value,
                      );
                      setDestination(reserva?.package?.city?.name || "");
                    }}
                    placeholder="Buscar reserva..."
                    noOptionsMessage={() =>
                      "No se encontraron reservas sin vuelo"
                    }
                  />
                </label>
                <label className="R-label">
                  Aerolínea
                  <input
                    type="text"
                    title="Nombre de la aerolínea"
                    value={airlineName}
                    onChange={(e) => {
                      setMensaje(null);
                      setAirlineName(e.target.value);
                    }}
                    className="R-input"
                    placeholder="Ej. Volaris"
                  />
                </label>
                <label className="R-label">
                  Destino
                  <input
                    type="text"
                    disabled
                    title="Es proporcionado por la reservación"
                    value={destination}
                    onChange={(e) => {
                      setMensaje(null);
                      setDestination(e.target.value);
                    }}
                    className="R-input bg-gray-300 cursor-not-allowed"
                    placeholder="Ej. Cancún"
                  />
                </label>
                <label className="R-label">
                  Horario de vuelo
                  <input
                    type="text"
                    title="Información referente al vuelo"
                    value={flightSchedule}
                    onChange={(e) => {
                      setMensaje(null);
                      setFlightSchedule(e.target.value);
                    }}
                    className="R-input"
                    placeholder="Ej. Gdl 6:18am - CUN 9:55am"
                  />
                </label>
                <label className="R-label">
                  HGDL o clave
                  <input
                    type="text"
                    title="Clave proporcionada por el proveedor"
                    value={hgdlKey}
                    onChange={(e) => {
                      setMensaje(null);
                      setHgdlKey(e.target.value);
                    }}
                    className="R-input"
                    placeholder="Ej. LGLU9Q/SEGURA"
                  />
                </label>
                <label className="R-label">
                  Medio de reservación
                  <input
                    type="text"
                    title="Nombre del referente o recomendador"
                    value={bookingSource}
                    onChange={(e) => {
                      setMensaje(null);
                      setBookingSource(e.target.value);
                    }}
                    className="R-input"
                    placeholder="Ej. Recibí con mi clave de agencia"
                  />
                </label>
                <label className="R-label">
                  Costo real en plataforma
                  <input
                    required
                    title="¿En cuánto se adquirió?"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={provideCost}
                    onChange={(e) => {
                      setMensaje(null);
                      setProvideCost(e.target.value);
                    }}
                    className="R-input"
                    placeholder="Ej. 1250.50"
                  />
                </label>
                <AgencyCostInput
                  value={clientCost}
                  providerCost={provideCost}
                  onChange={(value) => {
                    setMensaje(null);
                    setClientCost(value);
                  }}
                />
                <label className="R-label">
                  Observaciones
                  <textarea
                    name="observations"
                    value={observations}
                    rows={1}
                    className="R-textarea"
                    onChange={(e) => {
                      setMensaje(null);
                      setObservations(e.target.value);
                    }}
                    placeholder="Observaciones adicionales"
                  />
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="R-button-f flex items-center gap-2 h-18 justify-center cursor-pointer"
                    disabled={!selectedReservation || loading}
                  >
                    <SaveAllIcon size={18} />
                    {loading ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
