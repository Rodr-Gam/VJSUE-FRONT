import { api } from "../../../api";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import Select from "react-select";
import LoadingScreen from "../../../components/Admin/LoadingScreen";
import {
  PlaneTakeoffIcon,
  RefreshCcwIcon,
  ArrowBigLeftIcon,
} from "lucide-react";
import AdminLayout from "../../../layouts/AdminLayout";
import AgencyCostInput from "../../../components/Admin/AgencyCostInput";
import { normalizeClientCost } from "../../../utils/serviceProfit";
import "../../../styles/VerReserva.css";

interface Flight {
  reservation_id: number;
  airline_name: string;
  destination: string;
  flight_schedule: string;
  hgdl_key: string;
  booking_source: string;
  provider_cost: string;
  client_cost: string;
  observations: string;
}

interface Reservation {
  id: number;
  package?: {
    name: string;
    user?: { name: string };
    city?: { name: string };
  };
}

interface SelectOption {
  value: number;
  label: string;
}

export default function EditarReserva() {
  const nav = useNavigate();
  const { id } = useParams();
  const [reserva, setReserva] = useState<Reservation[]>([]);
  const [reservationOptions, setReservationOptions] = useState<SelectOption[]>(
    [],
  );
  const [selectedReservation, setSelectedReservation] =
    useState<SelectOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [vuelo, setVuelo] = useState<Flight>({
    reservation_id: 0,
    airline_name: "",
    destination: "",
    flight_schedule: "",
    hgdl_key: "",
    booking_source: "",
    provider_cost: "",
    client_cost: "",
    observations: "",
  });
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "success" | "error";
  } | null>(null);

  const cargarTodo = async () => {
    try {
      setLoadingData(true);
      const vueloRes = await api.get(`/flights/${id}`);
      const data = vueloRes.data;

      setVuelo({
        reservation_id: data.reservation_id,
        airline_name: data.airline_name,
        destination: data.destination,
        flight_schedule: data.flight_schedule,
        hgdl_key: data.hgdl_key,
        booking_source: data.booking_source ?? "",
        provider_cost: data.provider_cost,
        client_cost: data.client_cost ?? "",
        observations: data.observations ?? "",
      });

      const [sinVuelo, reservaActualRes] = await Promise.all([
        api.get("/reservations?without_flight=true"),
        api.get(`/reservations/${data.reservation_id}`),
      ]);

      const sinVueloFiltradas = sinVuelo.data.data.filter(
        (r: any) => r.state !== "canceled",
      );

      const todas = [
        reservaActualRes.data,
        ...sinVueloFiltradas.filter((r: any) => r.id !== data.reservation_id),
      ];

      setReserva(todas);
      setReservationOptions(
        todas.map((r) => ({
          value: r.id,
          label: `#${r.id} — ${r.package?.user?.name} | ${r.package?.name}`,
        })),
      );
    } catch (error) {
      console.error("Error al cargar:", error);
      setMensaje({ texto: "Error al cargar los datos.", tipo: "error" });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  useEffect(() => {
    if (reservationOptions.length > 0 && vuelo.reservation_id) {
      const opcionActual = reservationOptions.find(
        (o) => o.value === vuelo.reservation_id,
      );
      if (opcionActual) setSelectedReservation(opcionActual);
    }
  }, [reservationOptions, vuelo.reservation_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vuelo.airline_name.trim()) {
      setMensaje({
        texto: "El nombre de la aerolínea es requerido.",
        tipo: "error",
      });
      return;
    }
    const costAsNumber = parseFloat(vuelo.provider_cost);
    if (!vuelo.provider_cost || isNaN(costAsNumber) || costAsNumber <= 0) {
      setMensaje({ texto: "El costo debe ser mayor a 0.", tipo: "error" });
      return;
    }

    try {
      setLoading(true);
      await api.put(`/flights/${id}`, {
        ...vuelo,
        client_cost: normalizeClientCost(vuelo.client_cost),
      });
      setMensaje({ texto: "Vuelo actualizado con éxito.", tipo: "success" });
      setTimeout(() => nav("/admin/ver-vuelo"), 1500);
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(", ")
          : null) ||
        "Error al actualizar el vuelo.";
      setMensaje({ texto: msg, tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData)
  return (
    <AdminLayout>
      <LoadingScreen icon={PlaneTakeoffIcon} text="Cargando vuelo..." />
    </AdminLayout>
  );

  if (!vuelo) {
    return (
      <AdminLayout>
        <p className="text-center py-10">No se encontró el vuelo.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="R-dashboard-cards">
        <div className="flex-1">
          <div className="R-card-tt">
            <h2 className="R-dashboard-title text-[#d3a762]">Editar vuelo</h2>
          </div>

          <div className="R-card-f">
            <div className="flex items-center gap-2 mb-4">
              <PlaneTakeoffIcon size={24} className="text-[#d3a762]" />
              <h3 className="text-lg font-bold text-black">
                Detalles del vuelo
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
                {/* 👇 react-select igual que en CrearVuelo */}
                <label className="R-label">
                  Reservación
                  <Select
                    options={reservationOptions}
                    value={selectedReservation}
                    onChange={(selected) => {
                      setMensaje(null);
                      setSelectedReservation(selected);
                      const reser = reserva.find(
                        (r) => r.id === selected?.value,
                      );
                      setVuelo({
                        ...vuelo,
                        reservation_id: selected?.value || 0,
                        destination: reser?.package?.city?.name || "",
                      });
                    }}
                    placeholder="Buscar reserva..."
                    noOptionsMessage={() => "No se encontraron reservas"}
                  />
                </label>

                {/* El resto de los campos igual que ya los tenías */}
                <label className="R-label flex-1">
                  Aerolínea
                  <input
                    type="text"
                    className="R-input"
                    value={vuelo.airline_name}
                    onChange={(e) =>
                      setVuelo({ ...vuelo, airline_name: e.target.value })
                    }
                  />
                </label>
                <label className="R-label">
                  Destino
                  <input
                    type="text"
                    className="R-input bg-gray-300 cursor-not-allowed"
                    readOnly
                    value={vuelo.destination}
                  />
                </label>
                <label className="R-label">
                  Horario de vuelo
                  <input
                    type="text"
                    className="R-input"
                    value={vuelo.flight_schedule}
                    onChange={(e) =>
                      setVuelo({ ...vuelo, flight_schedule: e.target.value })
                    }
                  />
                </label>
                <label className="R-label">
                  Hgdl o clave
                  <input
                    type="text"
                    className="R-input"
                    value={vuelo.hgdl_key}
                    onChange={(e) =>
                      setVuelo({ ...vuelo, hgdl_key: e.target.value })
                    }
                  />
                </label>
                <label className="R-label">
                  Medio de reservación
                  <input
                    type="text"
                    className="R-input"
                    value={vuelo.booking_source}
                    onChange={(e) =>
                      setVuelo({ ...vuelo, booking_source: e.target.value })
                    }
                  />
                </label>
                <label className="R-label">
                  Costo real en plataforma
                  <input
                    type="number"
                    className="R-input"
                    required
                    step="0.0001"
                    min="0"
                    value={vuelo.provider_cost}
                    onChange={(e) =>
                      setVuelo({ ...vuelo, provider_cost: e.target.value })
                    }
                  />
                </label>
                <AgencyCostInput
                  value={vuelo.client_cost}
                  providerCost={vuelo.provider_cost}
                  onChange={(value) =>
                    setVuelo({ ...vuelo, client_cost: value })
                  }
                />
                <label className="R-label">
                  Observaciones
                  <textarea
                    className="R-textarea"
                    rows={1}
                    value={vuelo.observations}
                    onChange={(e) =>
                      setVuelo({ ...vuelo, observations: e.target.value })
                    }
                  />
                </label>

                <div className="flex items-center gap-2">
                  <Link
                    to="/admin/ver-vuelo"
                    className="R-button-f flex items-center gap-2 h-18 justify-center"
                  >
                    <ArrowBigLeftIcon size={18} />
                    <span>Regresar</span>
                  </Link>
                  <button
                    type="submit"
                    className="R-button-f flex items-center gap-2 h-18 justify-center"
                    disabled={!vuelo.reservation_id || loading}
                  >
                    <RefreshCcwIcon size={18} />
                    {loading ? "Actualizando..." : "Actualizar"}
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
