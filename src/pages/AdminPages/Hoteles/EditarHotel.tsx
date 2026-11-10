import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../../api";
import "../../../styles/VerReserva.css";
import {
  SaveAllIcon,
  BuildingIcon,
  PencilIcon,
  DeleteIcon,
  PlusIcon,
  ArrowBigLeftIcon,
  HotelIcon,
} from "lucide-react";
import AdminLayout from "../../../layouts/AdminLayout";
import LoadingScreen from "../../../components/Admin/LoadingScreen";
import ConfirmDeleteModal from "../../../components/common/ConfirmDeleteModal";
import Toast from "../../../components/common/Toast";
import { useToast } from "../../../hooks/useToast";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type OccupancyType = "single" | "double" | "triple" | "quadruple" | "suite";

interface RoomPrice {
  id: number;
  occupancy_type: OccupancyType;
  nightly_rate: string;
  total_rooms: number;
}

interface Hotel {
  id: number;
  name: string;
  destination: string;
  hgdl_key: string;
  supplier: string;
  booking_source: string;
  check_in_out?: string | null;
  provider_cost: string;
  client_cost?: string | null;
  observations: string;
  reservation?: {
    state: string;
    user?: { name: string };
    package?: { name: string };
  };
  room_prices: RoomPrice[];
}

// Fila en modo edición inline
interface RoomEditing {
  nightly_rate: string;
  total_rooms: string;
}

// Fila nueva pendiente de guardar
interface NewRoomForm {
  occupancy_type: OccupancyType | "";
  nightly_rate: string;
  total_rooms: string;
}

const OCCUPANCY_OPTIONS: { value: OccupancyType; label: string }[] = [
  { value: "single", label: "Individual" },
  { value: "double", label: "Doble" },
  { value: "triple", label: "Triple" },
  { value: "quadruple", label: "Cuádruple" },
  { value: "suite", label: "Suite" },
];

const EMPTY_NEW_ROOM: NewRoomForm = {
  occupancy_type: "",
  nightly_rate: "",
  total_rooms: "1",
};

const formatPrice = (v: string | number) => `$${Number(v).toFixed(2)}`;

// ─── Componente ───────────────────────────────────────────────────────────────

export default function EditarHotel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mensaje, mostrarMensaje } = useToast();
  const [loadingData, setLoadingData] = useState(true);

  // ── Estado del hotel ────────────────────────────────────────────────────────
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [savingHotel, setSavingHotel] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // reserva cancelada o pagada

  // Campos editables del hotel
  const [name, setName] = useState("");
  const [hgdlKey, setHgdlKey] = useState("");
  const [supplier, setSupplier] = useState("");
  const [bookingSource, setBookingSource] = useState("");
  const [checkInOut, setCheckInOut] = useState("");
  const [observations, setObservations] = useState("");

  // ── Estado de habitaciones ──────────────────────────────────────────────────
  // editingId: id de la habitación en modo edición inline (null = ninguna)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<RoomEditing>({
    nightly_rate: "",
    total_rooms: "",
  });
  const [savingRoom, setSavingRoom] = useState(false);

  // nueva habitación
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [newRoom, setNewRoom] = useState<NewRoomForm>({ ...EMPTY_NEW_ROOM });
  const [savingNew, setSavingNew] = useState(false);

  // eliminar habitación
  const [modalEliminarRoom, setModalEliminarRoom] = useState<number | null>(
    null,
  );
  const [deletingRoom, setDeletingRoom] = useState(false);

  // ─── Carga inicial ──────────────────────────────────────────────────────────

  const loadHotel = async () => {
    if (!id || isNaN(Number(id))) {
      mostrarMensaje("ID de hotel inválido.", "error");
      navigate("/admin/hoteles");
      return;
    }

    try {
      setLoadingData(true);
      const res = await api.get(`/hotels/${id}`);
      const data: Hotel = res.data;

      setHotel(data);

      // Poblar campos del formulario
      setName(data.name ?? "");
      setHgdlKey(data.hgdl_key ?? "");
      setSupplier(data.supplier ?? "");
      setBookingSource(data.booking_source ?? "");
      setCheckInOut(data.check_in_out ?? "");
      setObservations(data.observations ?? "");

      // Bloquear edición si la reserva está cancelada
      const state = data.reservation?.state;
      setIsLocked(state === "canceled");
    } catch (err: any) {
      const msg =
        err.response?.status === 404
          ? "Hotel no encontrado."
          : "Error al cargar el hotel.";
      mostrarMensaje(msg, "error");
      navigate("/admin/hoteles");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadHotel();
  }, [id]);

  // ─── Tipos de ocupación ya usados ───────────────────────────────────────────

  const usedTypes = hotel?.room_prices.map((r) => r.occupancy_type) ?? [];
  const availableTypes = OCCUPANCY_OPTIONS.filter(
    (o) => !usedTypes.includes(o.value),
  );

  // ─── Validaciones ───────────────────────────────────────────────────────────

  const validateHotel = (): string | null => {
    if (!name.trim()) return "El nombre del hotel es requerido.";
    if (!supplier.trim()) return "El proveedor es requerido.";
    return null;
  };

  const validateRoom = (data: {
    nightly_rate: string;
    total_rooms: string;
  }): string | null => {
    if (data.nightly_rate.trim()) {
      const rate = parseFloat(data.nightly_rate);
      if (isNaN(rate) || rate <= 0)
        return "El costo extra debe ser mayor a 0.";
    }

    if (data.total_rooms.trim()) {
      const rooms = parseInt(data.total_rooms);
      if (isNaN(rooms) || rooms < 0)
        return "El número de habitaciones no puede ser negativo.";
    }

    return null;
  };

  const validateNewRoom = (): string | null => {
    if (!newRoom.occupancy_type) return "Selecciona un tipo de ocupación.";
    if (usedTypes.includes(newRoom.occupancy_type as OccupancyType))
      return "Este tipo de habitación ya está registrado en este hotel.";
    if (!newRoom.nightly_rate.trim())
      return "Ingresa el costo extra de habitación para registrar este tipo.";
    return validateRoom(newRoom);
  };

  // ─── Guardar hotel ──────────────────────────────────────────────────────────

  const handleSaveHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    const error = validateHotel();
    if (error) {
      mostrarMensaje(error, "error");
      return;
    }

    try {
      setSavingHotel(true);
      await api.put(`/hotels/${id}`, {
        name: name.trim(),
        hgdl_key: hgdlKey.trim(),
        supplier: supplier.trim(),
        booking_source: bookingSource.trim(),
        check_in_out: checkInOut.trim() || null,
        observations: observations.trim(),
      });
      mostrarMensaje("Hotel actualizado correctamente.", "success");
      navigate("/admin/ver-hotel");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(", ")
          : null) ||
        "Error al actualizar el hotel.";
      mostrarMensaje(msg, "error");
    } finally {
      setSavingHotel(false);
    }
  };

  // ─── Editar habitación inline ───────────────────────────────────────────────

  const startEditRoom = (room: RoomPrice) => {
    setEditingId(room.id);
    setEditingData({
      nightly_rate: room.nightly_rate,
      total_rooms: String(room.total_rooms),
    });
  };

  const cancelEditRoom = () => {
    setEditingId(null);
    setEditingData({ nightly_rate: "", total_rooms: "" });
  };

  const handleSaveRoom = async (roomId: number) => {
    if (!editingData.nightly_rate.trim()) {
      mostrarMensaje("El costo extra de habitación es requerido en habitaciones registradas.", "error");
      return;
    }

    const error = validateRoom(editingData);
    if (error) {
      mostrarMensaje(error, "error");
      return;
    }

    try {
      setSavingRoom(true);
      await api.put(`/hotels/${id}/room-prices/${roomId}`, {
        nightly_rate: editingData.nightly_rate,
        total_rooms: parseInt(editingData.total_rooms) || 1,
      });
      mostrarMensaje("Habitación actualizada.", "success");
      cancelEditRoom();
      loadHotel();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Error al actualizar la habitación.";
      mostrarMensaje(msg, "error");
    } finally {
      setSavingRoom(false);
    }
  };

  // ─── Eliminar habitación ────────────────────────────────────────────────────

  const handleDeleteRoom = async () => {
    if (modalEliminarRoom === null) return;
    try {
      setDeletingRoom(true);
      await api.delete(`/hotels/${id}/room-prices/${modalEliminarRoom}`);
      setModalEliminarRoom(null);
      mostrarMensaje("Habitación eliminada correctamente.", "success");
      loadHotel();
    } catch (err: any) {
      setModalEliminarRoom(null);
      mostrarMensaje(
        err.response?.data?.message || "Error al eliminar la habitación.",
        "error",
      );
    } finally {
      setDeletingRoom(false);
    }
  };

  // ─── Agregar nueva habitación ───────────────────────────────────────────────

  const handleAddRoom = async () => {
    const error = validateNewRoom();
    if (error) {
      mostrarMensaje(error, "error");
      return;
    }

    try {
      setSavingNew(true);
      await api.post(`/hotels/${id}/room-prices`, {
        occupancy_type: newRoom.occupancy_type,
        nightly_rate: newRoom.nightly_rate,
        total_rooms: parseInt(newRoom.total_rooms) || 1,
      });
      mostrarMensaje("Habitación agregada correctamente.", "success");
      setNewRoom({ ...EMPTY_NEW_ROOM });
      setShowNewRoom(false);
      loadHotel();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(", ")
          : null) ||
        "Error al agregar la habitación.";
      mostrarMensaje(msg, "error");
    } finally {
      setSavingNew(false);
    }
  };

  if (loadingData) {
    return (
      <AdminLayout>
        <LoadingScreen icon={HotelIcon} text="Cargando hotel..." />
      </AdminLayout>
    );
  }

  if (!hotel) {
    return (
      <AdminLayout>
        <p className="text-center py-10">No se encontró el hotel.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="R-dashboard-cards">
        <div className="flex-1">
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="R-card-tt">
            <h2 className="R-dashboard-title text-[#d3a762]">Editar hotel</h2>
          </div>

          <div className="R-card-f space-y-8">
            {/* Banner de reserva cancelada */}
            {isLocked && (
              <div className="cc-alert cc-alert--error">
                <span className="cc-alert-icon">!</span>
                <span>
                  Este hotel pertenece a una reserva cancelada y no puede
                  editarse.
                </span>
              </div>
            )}

            {/* Info del cliente */}
            <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
              <BuildingIcon size={22} className="text-[#d3a762]" />
              <div>
                <p className="font-bold text-black text-[15px]">{hotel.name}</p>
                <p className="text-gray-500 text-[13px]">
                  Cliente:{" "}
                  <span className="font-medium">
                    {hotel.reservation?.user?.name ?? "—"}
                  </span>
                  {" · "}
                  Paquete:{" "}
                  <span className="font-medium">
                    {hotel.reservation?.package?.name ?? "—"}
                  </span>
                  {" · "}
                  Destino:{" "}
                  <span className="font-medium">
                    {hotel.destination ?? "—"}
                  </span>
                </p>
              </div>
            </div>

            {/* ── Sección 1: Datos del hotel ─────────────────────────────── */}
            <form onSubmit={handleSaveHotel} className="space-y-4">
              <h4 className="font-semibold text-black text-[15px]">
                Datos del hotel
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <label className="R-label">
                  Nombre del hotel
                  <input
                    type="text"
                    value={name}
                    maxLength={50}
                    disabled={isLocked}
                    onChange={(e) => setName(e.target.value)}
                    className={`R-input ${isLocked ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder="Ej. Hotel Krystal Grand"
                  />
                </label>

                <label className="R-label">
                  Destino
                  <input
                    type="text"
                    disabled
                    value={hotel.destination ?? ""}
                    title="El destino viene del paquete y no se puede cambiar aquí"
                    className="R-input bg-gray-300 cursor-not-allowed"
                  />
                </label>

                <label className="R-label">
                  Proveedor
                  <input
                    type="text"
                    value={supplier}
                    maxLength={45}
                    disabled={isLocked}
                    onChange={(e) => setSupplier(e.target.value)}
                    className={`R-input ${isLocked ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder="Ej. Booking, Expedia"
                  />
                </label>

                <label className="R-label">
                  HGDL o clave
                  <input
                    type="text"
                    value={hgdlKey}
                    maxLength={20}
                    disabled={isLocked}
                    onChange={(e) => setHgdlKey(e.target.value)}
                    className={`R-input ${isLocked ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder="Ej. LGLU9Q/SEGURA"
                  />
                </label>

                <label className="R-label">
                  Medio de reservación
                  <input
                    type="text"
                    value={bookingSource}
                    maxLength={50}
                    disabled={isLocked}
                    onChange={(e) => setBookingSource(e.target.value)}
                    className={`R-input ${isLocked ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder="Ej. Clave de agencia"
                  />
                </label>

                <label className="R-label">
                  Check-in / Check-out
                  <input
                    type="text"
                    value={checkInOut}
                    maxLength={255}
                    disabled={isLocked}
                    onChange={(e) => setCheckInOut(e.target.value)}
                    className={`R-input ${isLocked ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder="Ej. Check-in 3pm - Check-out 12pm"
                  />
                </label>

                <label className="R-label md:col-span-2">
                  Observaciones
                  <textarea
                    value={observations}
                    rows={1}
                    maxLength={1000}
                    disabled={isLocked}
                    className={`R-textarea ${isLocked ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Observaciones adicionales"
                  />
                </label>
              </div>

              {!isLocked && (
                <div className="flex items-center gap-2">
                  <Link
                    to="/admin/ver-hotel"
                    className="R-button-f flex items-center gap-2 justify-center cursor-pointer"
                  >
                    <ArrowBigLeftIcon size={18} />
                    <span>Regresar</span>
                  </Link>

                  <button
                    type="submit"
                    disabled={savingHotel}
                    className="R-button-f flex items-center gap-2 justify-center cursor-pointer"
                  >
                    <SaveAllIcon size={18} />
                    {savingHotel ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              )}
            </form>

            {/* ── Sección 2: Habitaciones ────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-black text-[15px]">
                  Tarifas por ocupación
                </h4>

                {/* Botón agregar — solo si quedan tipos disponibles y no está bloqueado */}
                {!isLocked && availableTypes.length > 0 && !showNewRoom && (
                  <button
                    type="button"
                    onClick={() => setShowNewRoom(true)}
                    className="flex items-center gap-1 text-sm text-[#d3a762] font-medium hover:underline"
                  >
                    <PlusIcon size={15} />
                    Agregar habitación
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-600">
                El costo extra de habitación es opcional al crear el hotel. Solo
                se registran tipos con costo extra capturado.
              </p>

              {/* Lista de habitaciones existentes */}
              {hotel.room_prices.length === 0 && !showNewRoom && (
                <p className="text-gray-400 text-sm py-4 text-center">
                  Este hotel no tiene habitaciones registradas.
                </p>
              )}

              <div className="space-y-2">
                {hotel.room_prices.map((room) => {
                  const label =
                    OCCUPANCY_OPTIONS.find(
                      (o) => o.value === room.occupancy_type,
                    )?.label ?? room.occupancy_type;

                  const isEditing = editingId === room.id;

                  return (
                    <div
                      key={room.id}
                      className={`border rounded-lg p-3 transition-colors ${
                        isEditing
                          ? "border-[#d3a762] bg-amber-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      {isEditing ? (
                        /* ── Modo edición inline ── */
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                          {/* Tipo — solo lectura, no se puede cambiar */}
                          <label className="R-label">
                            Tipo de ocupación
                            <input
                              type="text"
                              value={label}
                              disabled
                              className="R-input bg-gray-200 cursor-not-allowed"
                            />
                          </label>

                          <label className="R-label">
                            Costo extra habitación
                            <input
                              type="number"
                              step="0.0001"
                              min="0.0001"
                              value={editingData.nightly_rate}
                              onChange={(e) =>
                                setEditingData((prev) => ({
                                  ...prev,
                                  nightly_rate: e.target.value,
                                }))
                              }
                              className="R-input"
                              autoFocus
                            />
                          </label>

                          <div className="flex items-end gap-2">
                            <label className="R-label flex-1">
                              Habitaciones
                              <input
                                type="number"
                                step="1"
                                min="0"
                                max="9999"
                                value={editingData.total_rooms}
                                onChange={(e) =>
                                  setEditingData((prev) => ({
                                    ...prev,
                                    total_rooms: e.target.value,
                                  }))
                                }
                                className="R-input"
                              />
                            </label>

                            <div className="flex gap-2 mb-1">
                              <button
                                type="button"
                                onClick={() => handleSaveRoom(room.id)}
                                disabled={savingRoom}
                                className="text-sm text-white bg-[#d3a762] hover:bg-[#b8894a] px-3 py-1.5 rounded font-medium disabled:opacity-50"
                              >
                                {savingRoom ? "..." : "Guardar"}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditRoom}
                                disabled={savingRoom}
                                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded border border-gray-300"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* ── Modo lectura ── */
                        <div className="flex items-center justify-between">
                          <div className="text-[13px] text-gray-700 space-x-4">
                            <span className="font-semibold">{label}</span>
                            <span>{formatPrice(room.nightly_rate)} extra</span>
                            <span className="text-gray-500">
                              {room.total_rooms} habitación(es) disponible(s)
                            </span>
                          </div>

                          {!isLocked && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => startEditRoom(room)}
                                title="Editar"
                                className="R-btn-action R-btn-edit"
                              >
                                <PencilIcon
                                  size={16}
                                  className="text-[#d3a762]"
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => setModalEliminarRoom(room.id)}
                                title="Eliminar"
                                className="R-btn-action R-btn-edit"
                              >
                                <DeleteIcon
                                  size={16}
                                  className="text-red-500"
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ── Fila de nueva habitación ──────────────────────────── */}
                {showNewRoom && (
                  <div className="border border-dashed border-[#d3a762] rounded-lg p-3 bg-amber-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <label className="R-label">
                        Tipo de ocupación
                        <select
                          value={newRoom.occupancy_type}
                          onChange={(e) =>
                            setNewRoom((prev) => ({
                              ...prev,
                              occupancy_type: e.target.value as OccupancyType,
                            }))
                          }
                          className="R-input"
                        >
                          <option value="">Seleccionar...</option>
                          {availableTypes.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="R-label">
                        Costo extra habitación (opcional)
                        <input
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          value={newRoom.nightly_rate}
                          onChange={(e) =>
                            setNewRoom((prev) => ({
                              ...prev,
                              nightly_rate: e.target.value,
                            }))
                          }
                          className="R-input"
                          placeholder="Ej. 1200.00"
                          autoFocus
                        />
                      </label>

                      <div className="flex items-end gap-2">
                        <label className="R-label flex-1">
                          Habitaciones
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="9999"
                            value={newRoom.total_rooms}
                            onChange={(e) =>
                              setNewRoom((prev) => ({
                                ...prev,
                                total_rooms: e.target.value,
                              }))
                            }
                            className="R-input"
                            placeholder="Ej. 10"
                          />
                        </label>

                        <div className="flex gap-2 mb-1">
                          <button
                            type="button"
                            onClick={handleAddRoom}
                            disabled={savingNew}
                            className="text-sm text-white bg-[#d3a762] hover:bg-[#b8894a] px-3 py-1.5 rounded font-medium disabled:opacity-50"
                          >
                            {savingNew ? "..." : "Agregar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewRoom(false);
                              setNewRoom({ ...EMPTY_NEW_ROOM });
                            }}
                            disabled={savingNew}
                            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded border border-gray-300"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mensaje cuando ya están los 5 tipos */}
              {availableTypes.length === 0 && (
                <p className="text-gray-400 text-xs text-center pt-1">
                  Todos los tipos de habitación han sido registrados.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Toast mensaje={mensaje} />

      <ConfirmDeleteModal
        isOpen={modalEliminarRoom !== null}
        title="¿Eliminar habitación?"
        onCancel={() => setModalEliminarRoom(null)}
        onConfirm={handleDeleteRoom}
      />
    </AdminLayout>
  );
}
