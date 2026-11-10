import { useState, useEffect } from "react";
import { api } from "../../../api";
import Select from "react-select";
import "../../../styles/VerReserva.css";
import { SaveAllIcon, BuildingIcon } from "lucide-react";
import AdminLayout from "../../../layouts/AdminLayout";

// ─── Tipos ────────────────────────────────────────────────────────────────────

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

interface RoomPriceForm {
  occupancy_type: "single" | "double" | "triple" | "quadruple" | "suite" | "";
  nightly_rate: string;
  total_rooms: string;
}

const OCCUPANCY_OPTIONS: {
  value: RoomPriceForm["occupancy_type"];
  label: string;
}[] = [
  { value: "single", label: "Individual" },
  { value: "double", label: "Doble" },
  { value: "triple", label: "Triple" },
  { value: "quadruple", label: "Cuádruple" },
  { value: "suite", label: "Suite" },
];

const EMPTY_ROOM: RoomPriceForm = {
  occupancy_type: "",
  nightly_rate: "",
  total_rooms: "1",
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CrearHotel() {
  // selector de reservación
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationOptions, setReservationOptions] = useState<SelectOption[]>(
    [],
  );
  const [selectedReservation, setSelectedReservation] =
    useState<SelectOption | null>(null);

  // datos del hotel
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [hgdlKey, setHgdlKey] = useState("");
  const [supplier, setSupplier] = useState("");
  const [bookingSource, setBookingSource] = useState("");
  const [checkInOut, setCheckInOut] = useState("");
  const [observations, setObservations] = useState("");

  // habitaciones dinámicas
  const [roomPrices, setRoomPrices] = useState<RoomPriceForm[]>([
    { ...EMPTY_ROOM },
  ]);

  // estado UI
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "success" | "error";
  } | null>(null);

  // ─── Carga de reservaciones sin hotel ──────────────────────────────────────

  const loadReservations = () => {
    api
      .get("/reservations?without_hotel=true")
      .then((res) => {
        // Seguridad: filtrar canceladas en el front también, aunque el back ya las excluye
        const filtered: Reservation[] = (res.data.data ?? res.data).filter(
          (r: Reservation) => r.state !== "canceled",
        );

        setReservations(filtered);
        setReservationOptions(
          filtered.map((r) => ({
            value: r.id,
            label: `#${r.id} — ${r.user?.name ?? "Sin cliente"} | ${r.package?.name ?? "Sin paquete"}`,
          })),
        );
      })
      .catch((err) => {
        console.error("Error al cargar reservaciones:", err);
        setMensaje({
          texto: "No se pudieron cargar las reservaciones.",
          tipo: "error",
        });
      });
  };

  useEffect(() => {
    loadReservations();
  }, []);

  // ─── Manejo de habitaciones ─────────────────────────────────────────────────

  const handleRoomChange = (
    index: number,
    field: keyof RoomPriceForm,
    value: string,
  ) => {
    setMensaje(null);
    setRoomPrices((prev) =>
      prev.map((room, i) => (i === index ? { ...room, [field]: value } : room)),
    );
  };

  const addRoom = () => {
    // Máximo 5 filas (uno por cada occupancy_type disponible)
    if (roomPrices.length >= 5) return;
    setRoomPrices((prev) => [...prev, { ...EMPTY_ROOM }]);
  };

  const removeRoom = (index: number) => {
    // Siempre dejar al menos una fila
    if (roomPrices.length === 1) return;
    setRoomPrices((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Validación del formulario ──────────────────────────────────────────────

  const validate = (): string | null => {
    if (!selectedReservation) return "Selecciona una reservación.";
    if (!name.trim()) return "El nombre del hotel es requerido.";
    if (!supplier.trim()) return "El proveedor es requerido.";

    const filledRooms = roomPrices.filter(
      (r) => r.occupancy_type || r.nightly_rate.trim(),
    );

    for (const [i, room] of filledRooms.entries()) {
      if (!room.occupancy_type)
        return `Habitación ${i + 1}: selecciona un tipo de ocupación.`;

      if (room.nightly_rate.trim()) {
        const rate = parseFloat(room.nightly_rate);
        if (isNaN(rate) || rate <= 0)
          return `Habitación ${i + 1}: el costo extra debe ser mayor a 0.`;
      }

      if (room.total_rooms.trim()) {
        const rooms = parseInt(room.total_rooms);
        if (isNaN(rooms) || rooms < 0)
          return `Habitación ${i + 1}: el número de habitaciones no puede ser negativo.`;
      }
    }

    // No permitir el mismo tipo de ocupación dos veces
    const types = filledRooms.map((r) => r.occupancy_type).filter(Boolean);
    if (new Set(types).size !== types.length)
      return "No puedes registrar dos habitaciones del mismo tipo de ocupación.";

    return null;
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validate();
    if (error) {
      setMensaje({ texto: error, tipo: "error" });
      return;
    }

    try {
      setLoading(true);

      // 1. Crear el hotel
      const hotelRes = await api.post("/hotels", {
        reservation_id: selectedReservation!.value,
        name: name.trim(),
        destination: destination.trim(),
        hgdl_key: hgdlKey.trim(),
        supplier: supplier.trim(),
        booking_source: bookingSource.trim(),
        check_in_out: checkInOut.trim() || null,
        observations: observations.trim(),
      });

      const hotelId: number = hotelRes.data.hotel.id;

      const filledRooms = roomPrices.filter((r) => {
        if (!r.occupancy_type || !r.nightly_rate.trim()) return false;
        const rate = parseFloat(r.nightly_rate);
        return !isNaN(rate) && rate > 0;
      });

      // Llamadas en paralelo — más rápido que secuencial
      await Promise.all(
        filledRooms.map((room) =>
          api.post(`/hotels/${hotelId}/room-prices`, {
            occupancy_type: room.occupancy_type,
            nightly_rate: room.nightly_rate,
            total_rooms: parseInt(room.total_rooms) || 1,
          }),
        ),
      );

      setMensaje({ texto: "Hotel creado con éxito.", tipo: "success" });

      // Reset del formulario
      setSelectedReservation(null);
      setName("");
      setDestination("");
      setHgdlKey("");
      setSupplier("");
      setBookingSource("");
      setCheckInOut("");
      setObservations("");
      setRoomPrices([{ ...EMPTY_ROOM }]);
      loadReservations();
    } catch (err: any) {
      // Muestra el mensaje de negocio del back (ej: "Esta reserva ya tiene un hotel asignado.")
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(", ")
          : null) ||
        "Error al crear el hotel.";
      setMensaje({ texto: msg, tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="R-dashboard-cards">
        <div className="flex-1">
          <div className="R-card-tt">
            <h2 className="R-dashboard-title text-[#d3a762]">Nuevo hotel</h2>
          </div>

          <div className="R-card-f">
            <div className="flex items-center gap-2 mb-4">
              <BuildingIcon size={24} className="text-[#d3a762]" />
              <h3 className="text-lg font-bold text-black">
                Crea un nuevo registro de hotel
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ── Datos del hotel ───────────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                <label className="R-label">
                  Reservación
                  <Select
                    options={reservationOptions}
                    value={selectedReservation}
                    onChange={(selected) => {
                      setMensaje(null);
                      setSelectedReservation(selected);
                      // Autocompletar destino desde el paquete
                      const reserva = reservations.find(
                        (r) => r.id === selected?.value,
                      );
                      setDestination(reserva?.package?.city?.name ?? "");
                    }}
                    placeholder="Buscar reserva..."
                    noOptionsMessage={() =>
                      "No hay reservaciones sin hotel asignado"
                    }
                  />
                </label>

                <label className="R-label">
                  Nombre del hotel
                  <input
                    type="text"
                    value={name}
                    maxLength={50}
                    onChange={(e) => {
                      setMensaje(null);
                      setName(e.target.value);
                    }}
                    className="R-input"
                    placeholder="Ej. Hotel Krystal Grand"
                  />
                </label>

                <label className="R-label">
                  Destino
                  <input
                    type="text"
                    disabled
                    title="Se obtiene automáticamente del paquete"
                    value={destination}
                    className="R-input bg-gray-300 cursor-not-allowed"
                    placeholder="Ej. Cancún"
                  />
                </label>

                <label className="R-label">
                  Proveedor
                  <input
                    type="text"
                    value={supplier}
                    maxLength={45}
                    onChange={(e) => {
                      setMensaje(null);
                      setSupplier(e.target.value);
                    }}
                    className="R-input"
                    placeholder="Ej. Booking, Expedia"
                  />
                </label>

                <label className="R-label">
                  HGDL o clave
                  <input
                    type="text"
                    value={hgdlKey}
                    maxLength={20}
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
                    value={bookingSource}
                    maxLength={50}
                    onChange={(e) => {
                      setMensaje(null);
                      setBookingSource(e.target.value);
                    }}
                    className="R-input"
                    placeholder="Ej. Recibí con mi clave de agencia"
                  />
                </label>

                <label className="R-label">
                  Check-in / Check-out
                  <input
                    type="text"
                    value={checkInOut}
                    maxLength={255}
                    onChange={(e) => {
                      setMensaje(null);
                      setCheckInOut(e.target.value);
                    }}
                    className="R-input"
                    placeholder="Ej. Check-in 3pm - Check-out 12pm"
                  />
                </label>

                <label className="R-label lg:col-span-2">
                  Observaciones
                  <textarea
                    value={observations}
                    rows={1}
                    maxLength={1000}
                    className="R-textarea"
                    onChange={(e) => {
                      setMensaje(null);
                      setObservations(e.target.value);
                    }}
                    placeholder="Observaciones adicionales"
                  />
                </label>
              </div>

              {/* ── Habitaciones ──────────────────────────────────────────── */}
              <div className="px-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-black text-[15px]">
                    Tarifas por ocupación
                  </h4>
                  <button
                    type="button"
                    onClick={addRoom}
                    disabled={roomPrices.length >= 5}
                    className="text-sm text-[#d3a762] font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    + Agregar habitación
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  El costo extra de habitación es opcional. Si lo capturas, se
                  sumará al cliente en el desglose financiero.
                </p>

                <div className="space-y-3">
                  {roomPrices.map((room, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      {/* Tipo de ocupación */}
                      <label className="R-label">
                        Tipo de ocupación
                        <select
                          value={room.occupancy_type}
                          onChange={(e) =>
                            handleRoomChange(
                              index,
                              "occupancy_type",
                              e.target.value,
                            )
                          }
                          className="R-input"
                        >
                          <option value="">Seleccionar...</option>
                          {OCCUPANCY_OPTIONS.map((opt) => {
                            // Deshabilitar tipos ya elegidos en otras filas
                            const usedInOtherRow = roomPrices.some(
                              (r, i) =>
                                i !== index && r.occupancy_type === opt.value,
                            );
                            return (
                              <option
                                key={opt.value}
                                value={opt.value}
                                disabled={usedInOtherRow}
                              >
                                {opt.label}
                              </option>
                            );
                          })}
                        </select>
                      </label>

                      {/* Costo extra habitación */}
                      <label className="R-label">
                        Costo extra habitación (opcional)
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          value={room.nightly_rate}
                          onChange={(e) =>
                            handleRoomChange(
                              index,
                              "nightly_rate",
                              e.target.value,
                            )
                          }
                          className="R-input"
                          placeholder="Ej. 1200.00"
                        />
                      </label>

                      {/* Total de habitaciones */}
                      <div className="flex items-end gap-2">
                        <label className="R-label flex-1">
                          Habitaciones
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="9999"
                            value={room.total_rooms}
                            onChange={(e) =>
                              handleRoomChange(
                                index,
                                "total_rooms",
                                e.target.value,
                              )
                            }
                            className="R-input"
                            placeholder="Ej. 10"
                          />
                        </label>

                        {/* Botón quitar fila */}
                        <button
                          type="button"
                          onClick={() => removeRoom(index)}
                          disabled={roomPrices.length === 1}
                          title="Quitar habitación"
                          className="mb-1 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-xl leading-none"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Botón guardar ─────────────────────────────────────────── */}
              <div className="px-4">
                <button
                  type="submit"
                  className="R-button-f flex items-center gap-2 justify-center cursor-pointer"
                  disabled={!selectedReservation || loading}
                >
                  <SaveAllIcon size={18} />
                  {loading ? "Guardando..." : "Guardar hotel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
