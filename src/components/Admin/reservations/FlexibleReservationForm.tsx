import { useState, useEffect, useMemo } from "react";
import { api } from "../../../api";
import AdminLayout from "../../../layouts/AdminLayout";
import "../../../styles/VerReserva.css";
import "../../../styles/QuickReservation.css";
import {
  SaveAllIcon,
  PlusIcon,
  XIcon,
  UserRound,
  MapPinned,
  Users,
  Plane,
  Bus,
  Hotel,
  Sparkles,
} from "lucide-react";
import QuickReservationFinanceSummary from "../../../components/Admin/reservations/QuickReservationFinanceSummary";
import ServiceFinanceFields from "../../../components/Admin/ServiceFinanceFields";
import PackagePriceBreakdownFields, {
  getPackagePriceBreakdownError,
} from "../../../components/Admin/packages/PackageInfoPriceFields";
import {
  calcSupplierPaymentFromPlatformCost,
  type PlatformProfitPercent,
} from "../../../utils/packageInfoPricing";
import type { FlexibleReservationFormConfig } from "../../../config/flexibleReservationConfig";
import { buildQuickReservationFinanceSummary } from "../../../utils/quickReservationFinance";
import TourPaymentPlanSection from "./TourPaymentPlanSection";
import { clampPaymentPlanInstallments } from "../../../utils/paymentPlan";

interface City {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  last_name: string;
  email: string;
  state: "active" | "inactive" | "banned";
}

interface PassengerRow {
  type: "adult" | "junior" | "child";
  name: string;
  last_name: string;
  birth_date: string;
  nationality: string;
}

interface RoomPriceRow {
  occupancy_type: "single" | "double" | "triple" | "quadruple" | "suite";
  nightly_rate: string;
  total_rooms: string;
}

interface HotelSuggestion {
  name: string;
  destination: string | null;
  supplier: string | null;
  hgdl_key: string | null;
  booking_source: string | null;
  provider_cost: string | null;
}

const OCCUPANCY_TYPES: RoomPriceRow["occupancy_type"][] = [
  "single",
  "double",
  "triple",
  "quadruple",
  "suite",
];

const PASSENGER_LABEL: Record<PassengerRow["type"], string> = {
  adult: "Adulto",
  junior: "Juvenil",
  child: "Niño",
};

interface FlexibleReservationFormProps {
  config: FlexibleReservationFormConfig;
}

export default function FlexibleReservationForm({ config }: FlexibleReservationFormProps) {
  // Cliente (mismo patrón de autocompletado que CrearReserva)
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | "">("");

  //crear cliente
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [newClientName, setNewClientName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  // Ciudades
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState<number | "">("");

  // Datos generales del "paquete privado"
  const [duration, setDuration] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [reservationDate, setReservationDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [priceAdult, setPriceAdult] = useState("");
  const [priceJunior, setPriceJunior] = useState("");
  const [priceChild, setPriceChild] = useState("");
  const [packageTotalCost, setPackageTotalCost] = useState("");
  const [platformProfitPercent, setPlatformProfitPercent] =
    useState<PlatformProfitPercent>(17);
  const [packageClientCost, setPackageClientCost] = useState("");
  const [packageSupplierPayment, setPackageSupplierPayment] = useState("");
  const [packageBonusDiscount, setPackageBonusDiscount] = useState("");
  const [packageBonusDiscountNote, setPackageBonusDiscountNote] = useState("");
  const [reference, setReference] = useState("");
  const [stateReser, setStateReser] = useState("pending");
  const [observation, setObservation] = useState("");
  const [paymentPlanInstallments, setPaymentPlanInstallments] = useState(5);

  const isTourForm = config.apiPath === "/reservations/tours";

  // Conteo y detalle de pasajeros
  const [adults, setAdults] = useState(0);
  const [juniors, setJuniors] = useState(0);
  const [children, setChildren] = useState(0);
  const [passengers, setPassengers] = useState<PassengerRow[]>([]);

  // Hotel opcional
  const [includeHotel, setIncludeHotel] = useState(false);
  const [hotelName, setHotelName] = useState("");
  const [hotelDestination, setHotelDestination] = useState("");
  const [hotelSupplier, setHotelSupplier] = useState("");
  const [hotelKey, setHotelKey] = useState("");
  const [hotelBookingSource, setHotelBookingSource] = useState("");
  const [hotelCheckInOut, setHotelCheckInOut] = useState("");
  const [hotelObservation, setHotelObservation] = useState("");
  const [hotelSuggestions, setHotelSuggestions] = useState<HotelSuggestion[]>(
    [],
  );
  const [roomPrices, setRoomPrices] = useState<RoomPriceRow[]>([
    { occupancy_type: "double", nightly_rate: "", total_rooms: "1" },
  ]);

  // Vuelo opcional
  const [includeFlight, setIncludeFlight] = useState(false);
  const [flightAirline, setFlightAirline] = useState("");
  const [flightDestination, setFlightDestination] = useState("");
  const [flightSchedule, setFlightSchedule] = useState("");
  const [flightKey, setFlightKey] = useState("");
  const [flightBookingSource, setFlightBookingSource] = useState("");
  const [flightClientCost, setFlightClientCost] = useState("");
  const [flightSupplierPayment, setFlightSupplierPayment] = useState("");
  const [flightBonusDiscount, setFlightBonusDiscount] = useState("");
  const [flightBonusDiscountNote, setFlightBonusDiscountNote] = useState("");
  const [flightObservation, setFlightObservation] = useState("");

  // Transporte opcional
  const [includeTransport, setIncludeTransport] = useState(false);
  const [transportCompany, setTransportCompany] = useState("");
  const [transportDestination, setTransportDestination] = useState("");
  const [transportHorary, setTransportHorary] = useState("");
  const [transportSupplier, setTransportSupplier] = useState("");
  const [transportKey, setTransportKey] = useState("");
  const [transportBookingSource, setTransportBookingSource] = useState("");
  const [transportClientCost, setTransportClientCost] = useState("");
  const [transportSupplierPayment, setTransportSupplierPayment] = useState("");
  const [transportBonusDiscount, setTransportBonusDiscount] = useState("");
  const [transportBonusDiscountNote, setTransportBonusDiscountNote] = useState("");
  const [transportObservation, setTransportObservation] = useState("");

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const pay = calcSupplierPaymentFromPlatformCost(
      packageTotalCost,
      platformProfitPercent,
    );
    setPackageSupplierPayment(pay !== null ? pay.toFixed(2) : "");
  }, [packageTotalCost, platformProfitPercent]);

  const suggestedPackageClientTotal = useMemo(() => {
    const a = parseFloat(priceAdult) || 0;
    const j = parseFloat(priceJunior) || 0;
    const c = parseFloat(priceChild) || 0;
    const total = adults * a + juniors * j + children * c;
    if (total <= 0) return null;
    return total.toFixed(2);
  }, [adults, juniors, children, priceAdult, priceJunior, priceChild]);

  const tourClientTripTotal = useMemo(() => {
    if (!isTourForm) return 0;
    const summary = buildQuickReservationFinanceSummary({
      adults,
      juniors,
      children,
      priceAdult,
      priceJunior,
      priceChild,
      packagePlatformCost: packageTotalCost,
      packageSupplierPayment,
      packageClientCost,
      packageBonusDiscount,
      includeFlight,
      flightSupplierPayment,
      flightClientCost,
      flightBonusDiscount,
      includeTransport,
      transportSupplierPayment,
      transportClientCost,
      transportBonusDiscount,
      includeHotel,
      roomPrices,
    });
    return summary.totals.clientCost;
  }, [
    isTourForm,
    adults,
    juniors,
    children,
    priceAdult,
    priceJunior,
    priceChild,
    packageTotalCost,
    packageSupplierPayment,
    packageClientCost,
    packageBonusDiscount,
    includeFlight,
    flightSupplierPayment,
    flightClientCost,
    flightBonusDiscount,
    includeTransport,
    transportSupplierPayment,
    transportClientCost,
    transportBonusDiscount,
    includeHotel,
    roomPrices,
  ]);

  // ---- Cargar ciudades ----
  useEffect(() => {
    api
      .get("/cities")
      .then((res) => setCities(res.data))
      .catch((err) => console.error(err));
  }, []);

  // ---- Buscador de cliente (idéntico patrón a CrearReserva) ----
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

  // ---- Regenerar filas de pasajeros cuando cambian los conteos ----
  useEffect(() => {
    const buildRows = (
      type: PassengerRow["type"],
      count: number,
      prev: PassengerRow[],
    ) => {
      const existing = prev.filter((p) => p.type === type);
      const rows: PassengerRow[] = [];
      for (let i = 0; i < count; i++) {
        rows.push(
          existing[i] || {
            type,
            name: "",
            last_name: "",
            birth_date: "",
            nationality: "",
          },
        );
      }
      return rows;
    };

    setPassengers((prev) => [
      ...buildRows("adult", adults, prev),
      ...buildRows("junior", juniors, prev),
      ...buildRows("child", children, prev),
    ]);
  }, [adults, juniors, children]);

  // ---- Autocomplete de hotel ----
  useEffect(() => {
    if (hotelName.length < 2) {
      setHotelSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await api.get("/hotels/suggestions", {
          params: { q: hotelName },
        });
        setHotelSuggestions(res.data);
      } catch (error) {
        console.error(error);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [hotelName]);

  const applyHotelSuggestion = (s: HotelSuggestion) => {
    setHotelName(s.name);
    setHotelDestination(s.destination || "");
    setHotelSupplier(s.supplier || "");
    setHotelKey(s.hgdl_key || "");
    setHotelBookingSource(s.booking_source || "");
    setHotelSuggestions([]);
  };

  const addRoomPriceRow = () => {
    const used = roomPrices.map((r) => r.occupancy_type);
    const next =
      OCCUPANCY_TYPES.find((t) => !used.includes(t)) || OCCUPANCY_TYPES[0];
    setRoomPrices((prev) => [
      ...prev,
      { occupancy_type: next, nightly_rate: "", total_rooms: "1" },
    ]);
  };

  const removeRoomPriceRow = (idx: number) => {
    setRoomPrices((prev) => prev.filter((_, i) => i !== idx));
  };

  const updatePassenger = (
    idx: number,
    field: keyof PassengerRow,
    value: string,
  ) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    );
  };

  const resetForm = () => {
    setClientMode("existing");
    setNewClientName("");
    setNewClientLastName("");
    setNewClientEmail("");
    setNewClientPhone("");
    setSelectedUser("");
    setUserSearch("");
    setUserResults([]);
    setCityId("");
    setDuration("");
    setDepartureDate("");
    setReturnDate("");
    setReservationDate(new Date().toISOString().slice(0, 10));
    setPriceAdult("");
    setPriceJunior("");
    setPriceChild("");
    setPackageTotalCost("");
    setPackageClientCost("");
    setPackageSupplierPayment("");
    setPackageBonusDiscount("");
    setPackageBonusDiscountNote("");
    setReference("");
    setStateReser("pending");
    setObservation("");
    setAdults(0);
    setJuniors(0);
    setChildren(0);
    setPassengers([]);
    setIncludeHotel(false);
    setHotelName("");
    setHotelDestination("");
    setHotelSupplier("");
    setHotelKey("");
    setHotelBookingSource("");
    setHotelCheckInOut("");
    setHotelObservation("");
    setRoomPrices([
      { occupancy_type: "double", nightly_rate: "", total_rooms: "1" },
    ]);

    setIncludeFlight(false);
    setFlightAirline("");
    setFlightDestination("");
    setFlightSchedule("");
    setFlightKey("");
    setFlightBookingSource("");
    setFlightClientCost("");
    setFlightSupplierPayment("");
    setFlightBonusDiscount("");
    setFlightBonusDiscountNote("");
    setFlightObservation("");

    setIncludeTransport(false);
    setTransportCompany("");
    setTransportDestination("");
    setTransportHorary("");
    setTransportSupplier("");
    setTransportKey("");
    setTransportBookingSource("");
    setTransportClientCost("");
    setTransportSupplierPayment("");
    setTransportBonusDiscount("");
    setTransportBonusDiscountNote("");
    setTransportObservation("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passengers.length !== adults + juniors + children) {
      setMensaje({
        texto:
          "El número de pasajeros no coincide con el desglose de adultos/juniors/niños.",
        tipo: "error",
      });
      return;
    }

    if (
      clientMode === "new" &&
      (!newClientName.trim() || !newClientLastName.trim())
    ) {
      setMensaje({
        texto: "Nombre y apellido del cliente nuevo son obligatorios.",
        tipo: "error",
      });
      return;
    }

    if (clientMode === "existing" && !selectedUser) {
      setMensaje({ texto: "Selecciona un cliente existente.", tipo: "error" });
      return;
    }

    const priceBreakdownError = getPackagePriceBreakdownError(
      {
        packageTotalCost,
        priceAdult,
        priceJunior,
        priceChild,
        passengerCounts: { adults, juniors, children },
      },
      true,
    );
    if (priceBreakdownError) {
      setMensaje({ texto: priceBreakdownError, tipo: "error" });
      return;
    }

    if (isTourForm) {
      if (tourClientTripTotal <= 0) {
        setMensaje({
          texto:
            "Indica el precio total al cliente (cobro del viaje) para configurar el plan de pagos.",
          tipo: "error",
        });
        return;
      }
    }

    const payload: any = {
      city_id: cityId,
      duration,
      departure_date: departureDate,
      return_date: returnDate,
      reservation_date: reservationDate,
      price_adult: priceAdult,
      price_junior: priceJunior,
      price_child: priceChild,
      package_total_cost: packageTotalCost.trim() || null,
      package_platform_profit_percent: platformProfitPercent,
      package_provider_cost: packageSupplierPayment.trim() || null,
      package_client_cost: packageClientCost.trim() || null,
      package_supplier_payment: packageSupplierPayment.trim() || null,
      package_bonus_discount: packageBonusDiscount.trim() || null,
      package_bonus_discount_note: packageBonusDiscountNote.trim() || null,
      reference_person: reference.trim(),
      state: stateReser,
      observations: observation.trim(),
      adults,
      juniors,
      children,
      passengers,
    };

    if (isTourForm) {
      payload.payment_plan_installments = clampPaymentPlanInstallments(
        paymentPlanInstallments,
      );
    }

    if (clientMode === "existing") {
      payload.user_id = selectedUser;
    } else {
      payload.new_client = {
        name: newClientName.trim(),
        last_name: newClientLastName.trim(),
        email: newClientEmail.trim() || null,
        phone: newClientPhone.trim() || null,
      };
    }

    if (includeHotel) {
      payload.hotel = {
        name: hotelName,
        destination: hotelDestination || null,
        supplier: hotelSupplier || null,
        hgdl_key: hotelKey || null,
        booking_source: hotelBookingSource || null,
        check_in_out: hotelCheckInOut || null,
        observations: hotelObservation || null,
        room_prices: roomPrices.filter(
          (room) => room.nightly_rate.trim() !== "",
        ),
      };
    }

    if (includeFlight) {
      payload.flight = {
        airline_name: flightAirline,
        destination: flightDestination,
        flight_schedule: flightSchedule,
        hgdl_key: flightKey,
        booking_source: flightBookingSource || null,
        provider_cost: flightSupplierPayment.trim(),
        client_cost: flightClientCost || null,
        supplier_payment: flightSupplierPayment.trim() || null,
        bonus_discount: flightBonusDiscount.trim() || null,
        bonus_discount_note: flightBonusDiscountNote.trim() || null,
        observations: flightObservation || null,
      };
    }

    if (includeTransport) {
      payload.transport = {
        company: transportCompany,
        hgdl_key: transportKey,
        destination: transportDestination,
        horary: transportHorary,
        supplier: transportSupplier,
        provider_cost: transportSupplierPayment.trim(),
        client_cost: transportClientCost || null,
        supplier_payment: transportSupplierPayment.trim() || null,
        bonus_discount: transportBonusDiscount.trim() || null,
        bonus_discount_note: transportBonusDiscountNote.trim() || null,
        booking_source: transportBookingSource || null,
        observations: transportObservation || null,
      };
    }

    try {
      setLoading(true);
      const response = await api.post(config.apiPath, payload);
      setMensaje({
        texto:
          response.data.message ||
          `Reserva #${response.data.reservation.id} creada con éxito.`,
        tipo: "success",
      });
      resetForm();
    } catch (error: any) {
      console.error(error.response?.data?.errors);
      const firstError = error.response?.data?.errors
        ? (Object.values(error.response.data.errors)[0] as string[])?.[0]
        : null;
      setMensaje({
        texto:
          firstError ||
          error.response?.data?.message ||
          config.errorFallback,
        tipo: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="qr-page">
        <header className="R-card-tt">
          <h1 className="R-dashboard-title">{config.pageTitle}</h1>
          <p className="qr-hero-sub">{config.heroSubtitle}</p>
        </header>

        {mensaje && (
          <div className={`cc-alert cc-alert--${mensaje.tipo}`}>
            <span className="cc-alert-icon">{mensaje.tipo === "success" ? "✓" : "!"}</span>
            <span>{mensaje.texto}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <section className="R-card-f">
            <div className="qr-section-head">
              <span className="qr-section-icon" aria-hidden="true">
                <UserRound size={18} />
              </span>
              <div>
                <h2 className="qr-section-title">Cliente</h2>
                <p className="qr-section-desc">
                  Busca un cliente registrado o captura uno nuevo para esta reserva.
                </p>
              </div>
            </div>

            <div className="qr-client-block">
              <div className="qr-segment" role="tablist" aria-label="Tipo de cliente">
                <button
                  type="button"
                  role="tab"
                  aria-selected={clientMode === "existing"}
                  onClick={() => setClientMode("existing")}
                  className={`qr-segment-btn${clientMode === "existing" ? " qr-segment-btn--active" : ""}`}
                >
                  Cliente existente
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={clientMode === "new"}
                  onClick={() => setClientMode("new")}
                  className={`qr-segment-btn${clientMode === "new" ? " qr-segment-btn--active" : ""}`}
                >
                  Cliente nuevo
                </button>
              </div>

              {clientMode === "existing" ? (
                <label className="R-label" style={{ position: "relative" }}>
                  Buscar cliente
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      className="R-input"
                      placeholder="Nombre o email (mín. 2 caracteres)…"
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
                      <ul className="qr-dropdown">
                        {searching ? (
                          <li className="qr-dropdown-empty">Buscando…</li>
                        ) : userResults.length > 0 ? (
                          userResults.map((user) => (
                            <li
                              key={user.id}
                              onMouseDown={() => {
                                setSelectedUser(user.id);
                                setUserSearch(
                                  `${user.name} ${user.last_name} ${user.email ? `— ${user.email}` : "— sin correo"}`,
                                );
                                setShowDropdown(false);
                              }}
                            >
                              {user.name} {user.last_name}{" "}
                              {user.email ? `— ${user.email}` : "— sin correo"}
                            </li>
                          ))
                        ) : (
                          <li className="qr-dropdown-empty">Sin resultados</li>
                        )}
                      </ul>
                    )}
                  </div>
                </label>
              ) : (
                <div className="qr-new-client-grid">
                    <input
                      required
                      type="text"
                      placeholder="Nombre"
                      className="R-input"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                    />
                    <input
                      required
                      type="text"
                      placeholder="Apellido"
                      className="R-input"
                      value={newClientLastName}
                      onChange={(e) => setNewClientLastName(e.target.value)}
                    />
                    <input
                      type="email"
                      placeholder="Correo (opcional)"
                      className="R-input"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Teléfono"
                      className="R-input"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                    />
                </div>
              )}
            </div>
          </section>

          <section className="R-card-f">
            <div className="qr-section-head">
              <span className="qr-section-icon" aria-hidden="true">
                <MapPinned size={18} />
              </span>
              <div>
                <h2 className="qr-section-title">Viaje y precios</h2>
                <p className="qr-section-desc">
                  Fechas del viaje, costo en plataforma, reparto por edad y márgenes
                  comerciales.
                </p>
              </div>
            </div>

            <div className="qr-section-body">
              <div className="qr-trip-panel">
                <h3 className="qr-subpanel-title">Datos del viaje</h3>
                <div className="qr-grid qr-grid--4">
                <label className="R-label">
                  Ciudad
                  <select
                    required
                    className="R-select"
                    value={cityId}
                    onChange={(e) => setCityId(Number(e.target.value))}
                  >
                    <option value="">Selecciona ciudad</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="R-label">
                  Duración
                  <input
                    required
                    type="text"
                    className="R-input"
                    placeholder="Ej. 5 días / 4 noches"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </label>

                <label className="R-label">
                  Referencia
                  <input
                    type="text"
                    className="R-input"
                    placeholder="Ej. Chicas de Whatsapp"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </label>

                <label className="R-label">
                  Fecha de reserva
                  <input
                    required
                    type="date"
                    className="R-input"
                    value={reservationDate}
                    onChange={(e) => setReservationDate(e.target.value)}
                  />
                </label>

                <label className="R-label">
                  Salida del viaje
                  <input
                    required
                    type="date"
                    className="R-input"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                  />
                </label>

                <label className="R-label">
                  Regreso del viaje
                  <input
                    required
                    type="date"
                    className="R-input"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </label>

                <label className="R-label">
                  Estado
                  <select
                    required
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
                </div>
              </div>

              <div className="qr-pricing-panel">
                <PackagePriceBreakdownFields
                  packageTotalCost={packageTotalCost}
                  onPackageTotalCostChange={setPackageTotalCost}
                  priceAdult={priceAdult}
                  onPriceAdultChange={setPriceAdult}
                  priceJunior={priceJunior}
                  onPriceJuniorChange={setPriceJunior}
                  priceChild={priceChild}
                  onPriceChildChange={setPriceChild}
                  passengerCounts={{ adults, juniors, children }}
                  platformProfitPercent={platformProfitPercent}
                  onPlatformProfitPercentChange={setPlatformProfitPercent}
                  disabled={loading}
                />

                <div className="qr-commercial-block">
                  <h3 className="qr-subpanel-title">Cobro, pagos y ganancia</h3>
                  <ServiceFinanceFields
                    clientCost={packageClientCost}
                    onClientCostChange={setPackageClientCost}
                    supplierPayment={packageSupplierPayment}
                    onSupplierPaymentChange={setPackageSupplierPayment}
                    bonusDiscount={packageBonusDiscount}
                    onBonusDiscountChange={setPackageBonusDiscount}
                    bonusDiscountNote={packageBonusDiscountNote}
                    onBonusDiscountNoteChange={setPackageBonusDiscountNote}
                    disabled={loading}
                    clientHint={
                      suggestedPackageClientTotal
                        ? `Sugerido por pasajeros: $${suggestedPackageClientTotal}`
                        : undefined
                    }
                    supplierPaymentFromPlatform
                    platformProfitPercent={platformProfitPercent}
                  />
                </div>

                {isTourForm && (
                  <TourPaymentPlanSection
                    totalClientPrice={tourClientTripTotal}
                    installments={paymentPlanInstallments}
                    onInstallmentsChange={setPaymentPlanInstallments}
                    disabled={loading}
                  />
                )}
              </div>

              <label className="R-label qr-observations-block">
                Observaciones
                <textarea
                  rows={2}
                  className="R-textarea"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Observaciones adicionales sobre la reserva"
                />
              </label>
            </div>
          </section>

          <section className="R-card-f">
            <div className="qr-section-head">
              <span className="qr-section-icon" aria-hidden="true">
                <Users size={18} />
              </span>
              <div>
                <h2 className="qr-section-title">Pasajeros</h2>
                <p className="qr-section-desc">
                  Indica cuántos viajan y completa el detalle de cada pasajero.
                </p>
              </div>
            </div>

            <div className="qr-grid qr-grid--3">
                  <label className="R-label">
                    Adultos
                    <input
                      type="number"
                      min="0"
                      className="R-input"
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value) || 0)}
                    />
                  </label>
                  <label className="R-label">
                    Juvenil
                    <input
                      type="number"
                      min="0"
                      className="R-input"
                      value={juniors}
                      onChange={(e) => setJuniors(Number(e.target.value) || 0)}
                    />
                  </label>
                  <label className="R-label">
                    Niños
                    <input
                      type="number"
                      min="0"
                      className="R-input"
                      value={children}
                      onChange={(e) => setChildren(Number(e.target.value) || 0)}
                    />
                  </label>
            </div>

            {passengers.length > 0 && (
              <div className="qr-passengers-list">
                <div className="qr-passengers-head" aria-hidden="true">
                  <span>Tipo</span>
                  <span>Nombre</span>
                  <span>Apellido</span>
                  <span>Nacimiento</span>
                  <span>Nacionalidad</span>
                </div>
                {passengers.map((p, idx) => (
                  <div key={idx} className="qr-passenger-row">
                    <span className="qr-passenger-type">{PASSENGER_LABEL[p.type]}</span>
                        <input
                          required
                          type="text"
                          placeholder="Nombre"
                          className="R-input"
                          value={p.name}
                          onChange={(e) =>
                            updatePassenger(idx, "name", e.target.value)
                          }
                        />
                        <input
                          required
                          type="text"
                          placeholder="Apellido"
                          className="R-input"
                          value={p.last_name}
                          onChange={(e) =>
                            updatePassenger(idx, "last_name", e.target.value)
                          }
                        />
                        <input
                          required
                          type="date"
                          className="R-input"
                          value={p.birth_date}
                          onChange={(e) =>
                            updatePassenger(idx, "birth_date", e.target.value)
                          }
                        />
                        <input
                          required
                          type="text"
                          placeholder="Nacionalidad"
                          className="R-input"
                          value={p.nationality}
                          onChange={(e) =>
                            updatePassenger(idx, "nationality", e.target.value)
                          }
                        />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="R-card-f qr-services-intro">
            <div className="qr-section-head qr-section-head--compact">
              <span className="qr-section-icon" aria-hidden="true">
                <Sparkles size={18} />
              </span>
              <div>
                <h2 className="qr-section-title">Servicios opcionales</h2>
                <p className="qr-section-desc">
                  Activa hotel, vuelo o transporte solo si aplican a esta reserva.
                </p>
              </div>
            </div>
          </section>

          <section
            className={`R-card-f qr-service-card${includeHotel ? " qr-service-card--open" : ""}`}
          >
            <label className="qr-service-toggle">
              <input
                type="checkbox"
                checked={includeHotel}
                onChange={(e) => setIncludeHotel(e.target.checked)}
              />
              <Hotel size={18} aria-hidden="true" />
              <span>Incluir hotel</span>
            </label>

            {includeHotel && (
              <>
                <div className="qr-grid qr-grid--3">
                      <label
                        className="R-label"
                        style={{ position: "relative" }}
                      >
                        Nombre del hotel
                        <input
                          required
                          type="text"
                          className="R-input"
                          placeholder="Escribe para autocompletar..."
                          value={hotelName}
                          onChange={(e) => setHotelName(e.target.value)}
                        />
                        {hotelSuggestions.length > 0 && (
                          <ul className="qr-dropdown">
                            {hotelSuggestions.map((s, i) => (
                              <li
                                key={i}
                                onMouseDown={() => applyHotelSuggestion(s)}
                              >
                                {s.name} — {s.destination}
                              </li>
                            ))}
                          </ul>
                        )}
                      </label>

                      <label className="R-label">
                        Destino
                        <input
                          type="text"
                          className="R-input"
                          value={hotelDestination}
                          onChange={(e) => setHotelDestination(e.target.value)}
                        />
                      </label>
                      <label className="R-label">
                        Proveedor
                        <input
                          type="text"
                          className="R-input"
                          value={hotelSupplier}
                          onChange={(e) => setHotelSupplier(e.target.value)}
                        />
                      </label>
                      <label className="R-label">
                        HGDL Key
                        <input
                          type="text"
                          className="R-input"
                          value={hotelKey}
                          onChange={(e) => setHotelKey(e.target.value)}
                        />
                      </label>
                      <label className="R-label">
                        Medio de reservación
                        <input
                          type="text"
                          className="R-input"
                          value={hotelBookingSource}
                          onChange={(e) =>
                            setHotelBookingSource(e.target.value)
                          }
                        />
                      </label>
                      <label className="R-label">
                        Check-in / Check-out
                        <input
                          type="text"
                          className="R-input"
                          placeholder="Ej. Check-in 3pm - Check-out 12pm"
                          value={hotelCheckInOut}
                          onChange={(e) => setHotelCheckInOut(e.target.value)}
                        />
                      </label>
                    </div>
                    <label className="R-label">
                      Observaciones del hotel
                      <textarea
                        rows={1}
                        className="R-textarea"
                        value={hotelObservation}
                        onChange={(e) => setHotelObservation(e.target.value)}
                        placeholder="Notas específicas del hotel"
                      />
                    </label>

                    <div className="qr-subsection">
                      <div className="qr-subsection-head">
                        <h4 className="qr-subsection-title">Tarifas por ocupación</h4>
                        <button
                          type="button"
                          onClick={addRoomPriceRow}
                          className="qr-btn-link"
                        >
                          <PlusIcon size={16} /> Agregar tipo
                        </button>
                      </div>
                      <p className="qr-subsection-desc">
                        El costo extra de habitación es opcional. Si lo capturas,
                        se sumará al cliente en el desglose financiero.
                      </p>
                      {roomPrices.map((rp, idx) => (
                        <div key={idx} className="qr-room-row">
                          <select
                            className="R-select"
                            value={rp.occupancy_type}
                            onChange={(e) =>
                              setRoomPrices((prev) =>
                                prev.map((r, i) =>
                                  i === idx
                                    ? {
                                        ...r,
                                        occupancy_type: e.target
                                          .value as RoomPriceRow["occupancy_type"],
                                      }
                                    : r,
                                ),
                              )
                            }
                          >
                            {OCCUPANCY_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            step="0.0001"
                            min="0"
                            placeholder="Costo extra habitación (opcional)"
                            className="R-input"
                            value={rp.nightly_rate}
                            onChange={(e) =>
                              setRoomPrices((prev) =>
                                prev.map((r, i) =>
                                  i === idx
                                    ? { ...r, nightly_rate: e.target.value }
                                    : r,
                                ),
                              )
                            }
                          />
                          <input
                            type="number"
                            min="1"
                            placeholder="Habitaciones"
                            className="R-input"
                            value={rp.total_rooms}
                            onChange={(e) =>
                              setRoomPrices((prev) =>
                                prev.map((r, i) =>
                                  i === idx
                                    ? { ...r, total_rooms: e.target.value }
                                    : r,
                                ),
                              )
                            }
                          />
                          <button
                            type="button"
                            onClick={() => removeRoomPriceRow(idx)}
                            className="qr-btn-link qr-btn-link--danger"
                          >
                            <XIcon size={16} /> Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
          </section>

          <section
            className={`R-card-f qr-service-card${includeFlight ? " qr-service-card--open" : ""}`}
          >
            <label className="qr-service-toggle">
              <input
                type="checkbox"
                checked={includeFlight}
                onChange={(e) => setIncludeFlight(e.target.checked)}
              />
              <Plane size={18} aria-hidden="true" />
              <span>Incluir vuelo</span>
            </label>

            {includeFlight && (
              <div className="qr-grid qr-grid--3">
                    <label className="R-label">
                      Aerolínea
                      <input
                        required
                        type="text"
                        className="R-input"
                        placeholder="Ej. Volaris"
                        value={flightAirline}
                        onChange={(e) => setFlightAirline(e.target.value)}
                      />
                    </label>
                    <label className="R-label">
                      Destino
                      <input
                        required
                        type="text"
                        className="R-input"
                        placeholder="Ej. Cancún"
                        value={flightDestination}
                        onChange={(e) => setFlightDestination(e.target.value)}
                      />
                    </label>
                    <label className="R-label">
                      Horario de vuelo
                      <input
                        required
                        type="text"
                        className="R-input"
                        placeholder="Ej. Gdl 6:18am - CUN 9:55am"
                        value={flightSchedule}
                        onChange={(e) => setFlightSchedule(e.target.value)}
                      />
                    </label>
                    <label className="R-label">
                      HGDL o clave
                      <input
                        required
                        type="text"
                        className="R-input"
                        placeholder="Ej. LGLU9Q/SEGURA"
                        value={flightKey}
                        onChange={(e) => setFlightKey(e.target.value)}
                      />
                    </label>
                    <label className="R-label">
                      Medio de reservación
                      <input
                        type="text"
                        className="R-input"
                        value={flightBookingSource}
                        onChange={(e) => setFlightBookingSource(e.target.value)}
                      />
                    </label>
                    <div className="qr-grid-span-full">
                      <ServiceFinanceFields
                        clientCost={flightClientCost}
                        onClientCostChange={setFlightClientCost}
                        supplierPayment={flightSupplierPayment}
                        onSupplierPaymentChange={setFlightSupplierPayment}
                        bonusDiscount={flightBonusDiscount}
                        onBonusDiscountChange={setFlightBonusDiscount}
                        bonusDiscountNote={flightBonusDiscountNote}
                        onBonusDiscountNoteChange={setFlightBonusDiscountNote}
                        disabled={loading}
                      />
                    </div>
                    <label className="R-label qr-grid-span-full">
                      Observaciones del vuelo
                      <textarea
                        rows={1}
                        className="R-textarea"
                        value={flightObservation}
                        onChange={(e) => setFlightObservation(e.target.value)}
                        placeholder="Notas específicas del vuelo"
                      />
                    </label>
              </div>
            )}
          </section>

          <section
            className={`R-card-f qr-service-card${includeTransport ? " qr-service-card--open" : ""}`}
          >
            <label className="qr-service-toggle">
              <input
                type="checkbox"
                checked={includeTransport}
                onChange={(e) => setIncludeTransport(e.target.checked)}
              />
              <Bus size={18} aria-hidden="true" />
              <span>Incluir transporte</span>
            </label>

            {includeTransport && (
              <div className="qr-grid qr-grid--3">
                    <label className="R-label">
                      Compañía
                      <input
                        required
                        type="text"
                        className="R-input"
                        placeholder="Ej. Transportes Gdl"
                        value={transportCompany}
                        onChange={(e) => setTransportCompany(e.target.value)}
                      />
                    </label>
                    <label className="R-label">
                      Destino
                      <input
                        required
                        type="text"
                        className="R-input"
                        placeholder="Ej. Cancún"
                        value={transportDestination}
                        onChange={(e) =>
                          setTransportDestination(e.target.value)
                        }
                      />
                    </label>
                    <label className="R-label">
                      Horario
                      <input
                        required
                        type="text"
                        className="R-input"
                        placeholder="Ej. Recogida 10:00am - Llegada 11:30am"
                        value={transportHorary}
                        onChange={(e) => setTransportHorary(e.target.value)}
                      />
                    </label>
                    <label className="R-label">
                      Proveedor
                      <input
                        required
                        type="text"
                        className="R-input"
                        placeholder="Ej. ADO, Cancún Transfers"
                        value={transportSupplier}
                        onChange={(e) => setTransportSupplier(e.target.value)}
                      />
                    </label>
                    <label className="R-label">
                      HGDL o clave
                      <input
                        required
                        type="text"
                        className="R-input"
                        placeholder="Ej. LGLU9Q/SEGURA"
                        value={transportKey}
                        onChange={(e) => setTransportKey(e.target.value)}
                      />
                    </label>
                    <label className="R-label">
                      Medio de reservación
                      <input
                        type="text"
                        className="R-input"
                        value={transportBookingSource}
                        onChange={(e) =>
                          setTransportBookingSource(e.target.value)
                        }
                      />
                    </label>
                    <div className="qr-grid-span-full">
                      <ServiceFinanceFields
                        clientCost={transportClientCost}
                        onClientCostChange={setTransportClientCost}
                        supplierPayment={transportSupplierPayment}
                        onSupplierPaymentChange={setTransportSupplierPayment}
                        bonusDiscount={transportBonusDiscount}
                        onBonusDiscountChange={setTransportBonusDiscount}
                        bonusDiscountNote={transportBonusDiscountNote}
                        onBonusDiscountNoteChange={setTransportBonusDiscountNote}
                        disabled={loading}
                      />
                    </div>
                    <label className="R-label qr-grid-span-full">
                      Observaciones del transporte
                      <textarea
                        rows={1}
                        className="R-textarea"
                        value={transportObservation}
                        onChange={(e) =>
                          setTransportObservation(e.target.value)
                        }
                        placeholder="Notas específicas del transporte "
                      />
                    </label>
              </div>
            )}
          </section>

          <div className="R-finance-wrap">
            <QuickReservationFinanceSummary
              adults={adults}
              juniors={juniors}
              children={children}
              priceAdult={priceAdult}
              priceJunior={priceJunior}
              priceChild={priceChild}
              packagePlatformCost={packageTotalCost}
              packageSupplierPayment={packageSupplierPayment}
              packageClientCost={packageClientCost}
              packageBonusDiscount={packageBonusDiscount}
              includeFlight={includeFlight}
              flightSupplierPayment={flightSupplierPayment}
              flightClientCost={flightClientCost}
              flightBonusDiscount={flightBonusDiscount}
              includeTransport={includeTransport}
              transportSupplierPayment={transportSupplierPayment}
              transportClientCost={transportClientCost}
              transportBonusDiscount={transportBonusDiscount}
              includeHotel={includeHotel}
              roomPrices={roomPrices}
            />
          </div>

          <div className="qr-form-actions">
            <button
              type="submit"
              className="qr-submit"
              disabled={
                (clientMode === "existing" && !selectedUser) ||
                (clientMode === "new" &&
                  (!newClientName || !newClientLastName)) ||
                !cityId ||
                loading
              }
            >
              <SaveAllIcon size={18} />
              {loading ? config.submitLoadingLabel : config.submitLabel}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
