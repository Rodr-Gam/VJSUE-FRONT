import { useState, useEffect } from "react";
import { api } from "../../../api";
import Select from "react-select";
import "../../../styles/VerReserva.css";
import { SaveAllIcon, BusFrontIcon } from "lucide-react";
import AdminLayout from "../../../layouts/AdminLayout";
import AgencyCostInput from "../../../components/Admin/AgencyCostInput";
import { normalizeClientCost } from "../../../utils/serviceProfit";
import { unwrapReservationList } from "../../../utils/apiHelpers";

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

export default function CrearTransporte() {
  // buscador
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationOptions, setReservationOptions] = useState<SelectOption[]>(
    [],
  );
  const [selectedReservation, setSelectedReservation] =
    useState<SelectOption | null>(null);

  // datos
  const [company, setCompany] = useState("");
  const [destination, setDestination] = useState("");
  const [horary, setHorary] = useState("");
  const [supplier, setSupplier] = useState("");
  const [hgdlKey, setHgdlKey] = useState("");
  const [bookingSource, setBookingSource] = useState("");
  const [provideCost, setProvideCost] = useState<string>("");
  const [clientCost, setClientCost] = useState<string>("");
  const [observations, setObservations] = useState("");

  // mensajes
  const [loading, setLoading] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "success" | "error";
  } | null>(null);

  const loadReservations = async () => {
    try {
      setLoadingReservations(true);
      const res = await api.get(`/reservations?without_transport=true`);
      const list = unwrapReservationList<Reservation>(res.data);
      const filtered = list.filter((r) => r.state !== "canceled");

      setReservations(filtered);
      setReservationOptions(
        filtered.map((r) => ({
          value: r.id,
          label: `#${r.id} — ${r.user?.name || "Sin cliente"} | ${r.package?.name || "Sin paquete"}`,
        })),
      );
    } catch (error) {
      console.error("Error al cargar reservaciones:", error);
      setMensaje({
        texto: "No se pudieron cargar las reservaciones disponibles.",
        tipo: "error",
      });
    } finally {
      setLoadingReservations(false);
    }
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
    if (!company.trim()) {
      setMensaje({
        texto: "La empresa de transporte es requerida.",
        tipo: "error",
      });
      return;
    }
    if (!supplier.trim()) {
      setMensaje({ texto: "El proveedor es requerido.", tipo: "error" });
      return;
    }

    const costAsNumber = parseFloat(provideCost);
    if (!provideCost || isNaN(costAsNumber) || costAsNumber <= 0) {
      setMensaje({ texto: "El costo debe ser mayor a 0.", tipo: "error" });
      return;
    }

    try {
      setLoading(true);
      await api.post("/transports", {
        reservation_id: selectedReservation.value,
        company: company.trim(),
        destination: destination.trim(),
        horary: horary.trim(),
        supplier: supplier.trim(),
        hgdl_key: hgdlKey.trim(),
        booking_source: bookingSource.trim(),
        provider_cost: provideCost,
        client_cost: normalizeClientCost(clientCost),
        observations: observations.trim(),
      });

      setMensaje({ texto: "Transporte creado con éxito.", tipo: "success" });

      setSelectedReservation(null);
      setCompany("");
      setDestination("");
      setHorary("");
      setSupplier("");
      setHgdlKey("");
      setBookingSource("");
      setProvideCost("");
      setClientCost("");
      setObservations("");
      loadReservations();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(", ")
          : null) ||
        "Error al crear el transporte.";
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
            <h2 className="R-dashboard-title text-[#d3a762]">
              Nuevo transporte
            </h2>
          </div>
          <div className="R-card-f">
            <div className="flex items-center gap-2 mb-4">
              <BusFrontIcon size={24} className="text-[#d3a762]" />
              <h3 className="text-lg font-bold text-black">
                Crea un nuevo registro de transporte
              </h3>
            </div>

            {loadingReservations && (
              <div className="cc-alert cc-alert--info">
                <span className="cc-alert-icon">…</span>
                <span>Cargando reservaciones disponibles...</span>
              </div>
            )}

            {!loadingReservations && reservationOptions.length === 0 && (
              <div className="cc-alert cc-alert--info">
                <span className="cc-alert-icon">i</span>
                <span>
                  No hay reservaciones sin transporte. Crea una reserva primero
                  o asigna transporte desde Ver transportes.
                </span>
              </div>
            )}

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
                      "No se encontraron reservas sin transporte"
                    }
                  />
                </label>
                <label className="R-label">
                  Compañia
                  <input
                    type="text"
                    title="Empresa de transporte"
                    value={company}
                    onChange={(e) => {
                      setMensaje(null);
                      setCompany(e.target.value);
                    }}
                    className="R-input"
                    placeholder="Ej. Transportes Gdl"
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
                  Horario
                  <input
                    type="text"
                    title="Información referente al traslado"
                    value={horary}
                    onChange={(e) => {
                      setMensaje(null);
                      setHorary(e.target.value);
                    }}
                    className="R-input"
                    placeholder="Ej. Recogida 10:00am - Llegada 11:30am"
                  />
                </label>
                <label className="R-label">
                  Proveedor
                  <input
                    type="text"
                    title="Proveedor del servicio de transporte"
                    value={supplier}
                    onChange={(e) => {
                      setMensaje(null);
                      setSupplier(e.target.value);
                    }}
                    className="R-input"
                    placeholder="Ej. ADO, Cancún Transfers"
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
                    placeholder="Ej. 850.00"
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
                    disabled={loading || loadingReservations}
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
