import { api } from "../../../api";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import Select from "react-select";
import { TruckIcon, RefreshCcwIcon, ArrowBigLeftIcon } from "lucide-react";
import AdminLayout from "../../../layouts/AdminLayout";
import AgencyCostInput from "../../../components/Admin/AgencyCostInput";
import { normalizeClientCost } from "../../../utils/serviceProfit";
import LoadingScreen from "../../../components/Admin/LoadingScreen";
import "../../../styles/VerReserva.css";

interface Transport {
  reservation_id: number;
  company: string;
  destination: string;
  horary: string;
  supplier: string;
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

export default function EditarTransporte() {
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
  const [transporte, setTransporte] = useState<Transport>({
    reservation_id: 0,
    company: "",
    destination: "",
    horary: "",
    supplier: "",
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
      const transporteRes = await api.get(`/transports/${id}`);
      const data = transporteRes.data;

      setTransporte({
        reservation_id: data.reservation_id,
        company: data.company,
        destination: data.destination,
        horary: data.horary,
        supplier: data.supplier,
        hgdl_key: data.hgdl_key,
        booking_source: data.booking_source ?? "",
        provider_cost: data.provider_cost,
        client_cost: data.client_cost ?? "",
        observations: data.observations ?? "",
      });

      const [sinTransporte, reservaActualRes] = await Promise.all([
        api.get("/reservations?without_transport=true"),
        api.get(`/reservations/${data.reservation_id}`),
      ]);

      const sinTransporteFiltradas = sinTransporte.data.data.filter(
        (r: any) => r.state !== "canceled",
      );

      const todas = [
        reservaActualRes.data,
        ...sinTransporteFiltradas.filter(
          (r: any) => r.id !== data.reservation_id,
        ),
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
    if (reservationOptions.length > 0 && transporte.reservation_id) {
      const opcionActual = reservationOptions.find(
        (o) => o.value === transporte.reservation_id,
      );
      if (opcionActual) setSelectedReservation(opcionActual);
    }
  }, [reservationOptions, transporte.reservation_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transporte.company.trim()) {
      setMensaje({
        texto: "La empresa de transporte es requerida.",
        tipo: "error",
      });
      return;
    }
    if (!transporte.supplier.trim()) {
      setMensaje({ texto: "El proveedor es requerido.", tipo: "error" });
      return;
    }
    const costAsNumber = parseFloat(transporte.provider_cost);
    if (!transporte.provider_cost || isNaN(costAsNumber) || costAsNumber <= 0) {
      setMensaje({ texto: "El costo debe ser mayor a 0.", tipo: "error" });
      return;
    }

    try {
      setLoading(true);
      await api.put(`/transports/${id}`, {
        ...transporte,
        client_cost: normalizeClientCost(transporte.client_cost),
      });
      setMensaje({
        texto: "Transporte actualizado con éxito.",
        tipo: "success",
      });
      setTimeout(() => nav("/admin/ver-transporte"), 1500);
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(", ")
          : null) ||
        "Error al actualizar el transporte.";
      setMensaje({ texto: msg, tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData)
    return (
      <AdminLayout>
        <LoadingScreen icon={TruckIcon} text="Cargando transporte..." />
      </AdminLayout>
    );

  if (!transporte) {
    return (
      <AdminLayout>
        <p className="text-center py-10">No se encontró el transporte.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="R-dashboard-cards">
        <div className="flex-1">
          <div className="R-card-tt">
            <h2 className="R-dashboard-title text-[#d3a762]">
              Editar transporte
            </h2>
          </div>

          <div className="R-card-f">
            <div className="flex items-center gap-2 mb-4">
              <TruckIcon size={24} className="text-[#d3a762]" />
              <h3 className="text-lg font-bold text-black">
                Detalles del transporte
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
                      const reser = reserva.find(
                        (r) => r.id === selected?.value,
                      );
                      setTransporte({
                        ...transporte,
                        reservation_id: selected?.value || 0,
                        destination: reser?.package?.city?.name || "",
                      });
                    }}
                    placeholder="Buscar reserva..."
                    noOptionsMessage={() => "No se encontraron reservas"}
                  />
                </label>

                <label className="R-label flex-1">
                  Empresa
                  <input
                    type="text"
                    className="R-input"
                    value={transporte.company}
                    onChange={(e) =>
                      setTransporte({ ...transporte, company: e.target.value })
                    }
                  />
                </label>
                <label className="R-label">
                  Destino
                  <input
                    type="text"
                    className="R-input bg-gray-300 cursor-not-allowed"
                    readOnly
                    value={transporte.destination}
                  />
                </label>
                <label className="R-label">
                  Horario
                  <input
                    type="text"
                    className="R-input"
                    value={transporte.horary}
                    onChange={(e) =>
                      setTransporte({ ...transporte, horary: e.target.value })
                    }
                  />
                </label>
                <label className="R-label">
                  Proveedor
                  <input
                    type="text"
                    className="R-input"
                    value={transporte.supplier}
                    onChange={(e) =>
                      setTransporte({ ...transporte, supplier: e.target.value })
                    }
                  />
                </label>
                <label className="R-label">
                  Hgdl o clave
                  <input
                    type="text"
                    className="R-input"
                    value={transporte.hgdl_key}
                    onChange={(e) =>
                      setTransporte({ ...transporte, hgdl_key: e.target.value })
                    }
                  />
                </label>
                <label className="R-label">
                  Medio de reservación
                  <input
                    type="text"
                    className="R-input"
                    value={transporte.booking_source}
                    onChange={(e) =>
                      setTransporte({
                        ...transporte,
                        booking_source: e.target.value,
                      })
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
                    value={transporte.provider_cost}
                    onChange={(e) =>
                      setTransporte({
                        ...transporte,
                        provider_cost: e.target.value,
                      })
                    }
                  />
                </label>
                <AgencyCostInput
                  value={transporte.client_cost}
                  providerCost={transporte.provider_cost}
                  onChange={(value) =>
                    setTransporte({ ...transporte, client_cost: value })
                  }
                />
                <label className="R-label">
                  Observaciones
                  <textarea
                    className="R-textarea"
                    rows={1}
                    value={transporte.observations}
                    onChange={(e) =>
                      setTransporte({
                        ...transporte,
                        observations: e.target.value,
                      })
                    }
                  />
                </label>

                <div className="flex items-center gap-2">
                  <Link
                    to="/admin/ver-transporte"
                    className="R-button-f flex items-center gap-2 h-18 justify-center"
                  >
                    <ArrowBigLeftIcon size={18} />
                    <span>Regresar</span>
                  </Link>
                  <button
                    type="submit"
                    className="R-button-f flex items-center gap-2 h-18 justify-center"
                    disabled={!transporte.reservation_id || loading}
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
