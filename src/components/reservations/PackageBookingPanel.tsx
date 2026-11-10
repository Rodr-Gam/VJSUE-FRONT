import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { reservationService } from "../../reservationService";
import type { TravelPackage } from "../../types/package";
import {
  resolvePackageReturnDate,
  toDateInputValue,
} from "../../utils/packageDates";
import { parseReservationApiError } from "../../utils/reservationErrors";
import {
  getPackageAgeQuotas,
  isPackageAgeCategoryOffered,
  parsePackageUnitPrice,
} from "../../utils/packageAgeOfferings";
import {
  calculateReservationPreview,
  formatMXN,
  getTotalPassengers,
} from "../../utils/reservationPricing";
import PassengerStepper from "./PassengerStepper";
import ReservationSummary from "./ReservationSummary";

interface PackageBookingPanelProps {
  pkg: TravelPackage;
  userName?: string;
}

export default function PackageBookingPanel({
  pkg,
  userName,
}: PackageBookingPanelProps) {
  const navigate = useNavigate();
  const [adults, setAdults] = useState(1);
  const [juniors, setJuniors] = useState(0);
  const [children, setChildren] = useState(0);
  const [observations, setObservations] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "success" | "error";
  } | null>(null);

  const offerings = useMemo(
    () => ({
      adults: isPackageAgeCategoryOffered(pkg, "adults"),
      juniors: isPackageAgeCategoryOffered(pkg, "juniors"),
      children: isPackageAgeCategoryOffered(pkg, "children"),
    }),
    [pkg],
  );

  const quotas = useMemo(() => getPackageAgeQuotas(pkg), [pkg]);

  const prices = useMemo(
    () => ({
      adult: parsePackageUnitPrice(pkg.price_adult),
      junior: parsePackageUnitPrice(pkg.price_junior),
      child: parsePackageUnitPrice(pkg.price_child),
    }),
    [pkg],
  );

  useEffect(() => {
    if (!offerings.adults) setAdults(0);
    else if (adults < 1) setAdults(1);
    if (!offerings.juniors) setJuniors(0);
    if (!offerings.children) setChildren(0);
  }, [pkg.id, offerings.adults, offerings.juniors, offerings.children]);

  const counts = { adults, juniors, children };
  const totalPassengers = getTotalPassengers(counts);
  const previewTotal = calculateReservationPreview(counts, prices);
  const noStock = pkg.stock <= 0;

  const updateCount = (
    field: "adults" | "juniors" | "children",
    next: number,
  ) => {
    setMensaje(null);
    const clamped = Math.max(0, next);

    const draft = { ...counts, [field]: clamped };
    const draftTotal = getTotalPassengers(draft);

    if (draftTotal > pkg.stock) return;

    const cap =
      field === "adults"
        ? quotas.adults
        : field === "juniors"
          ? quotas.juniors
          : quotas.children;

    if (clamped > cap) return;

    if (field === "adults") setAdults(clamped);
    if (field === "juniors") setJuniors(clamped);
    if (field === "children") setChildren(clamped);
  };

  const maxForSimple = (field: "adults" | "juniors" | "children") => {
    const current =
      field === "adults" ? adults : field === "juniors" ? juniors : children;
    const cap =
      field === "adults"
        ? quotas.adults
        : field === "juniors"
          ? quotas.juniors
          : quotas.children;
    const usedByOthers = totalPassengers - current;
    return Math.min(cap, Math.max(0, pkg.stock - usedByOthers));
  };

  const validateBeforeSubmit = (): string | null => {
    if (noStock) return "Este paquete ya no tiene cupos disponibles.";
    if (totalPassengers < 1) {
      return "Debes reservar al menos un pasajero.";
    }
    if (totalPassengers > pkg.stock) {
      return `No hay suficientes lugares en stock. Solo quedan ${pkg.stock}.`;
    }
    if (offerings.adults && adults > quotas.adults) {
      return `Solo hay ${quotas.adults} cupos para adultos.`;
    }
    if (offerings.juniors && juniors > quotas.juniors) {
      return `Solo hay ${quotas.juniors} cupos para juvenil.`;
    }
    if (offerings.children && children > quotas.children) {
      return `Solo hay ${quotas.children} cupos para niños.`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateBeforeSubmit();
    if (validationError) {
      setMensaje({ texto: validationError, tipo: "error" });
      return;
    }

    try {
      setSubmitting(true);
      setMensaje(null);

      const trimmedObs = observations.trim();
      const response = await reservationService.createReservation({
        package_id: pkg.id,
        reservation_date: new Date().toISOString().slice(0, 10),
        departure_date: toDateInputValue(pkg.departure_date),
        return_date: resolvePackageReturnDate(pkg),
        adults: offerings.adults ? adults : 0,
        juniors: offerings.juniors ? juniors : 0,
        children: offerings.children ? children : 0,
        ...(trimmedObs ? { observations: trimmedObs } : {}),
      });

      const confirmedTotal = response.reservation.total_amount;
      const totalLabel =
        confirmedTotal != null
          ? Number(confirmedTotal).toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
            })
          : "";

      setMensaje({
        texto:
          "Reserva creada. Puedes completar los datos de pasajeros ahora o después." +
          (totalLabel ? ` Total confirmado: ${totalLabel}` : ""),
        tipo: "success",
      });

      setTimeout(() => {
        navigate(`/cliente/reservas/${response.reservation.id}/pasajeros`);
      }, 1200);
    } catch (error) {
      setMensaje({
        texto: parseReservationApiError(error),
        tipo: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled =
    submitting || noStock || totalPassengers < 1 || totalPassengers > pkg.stock;

  const firstName = userName?.split(" ")[0] ?? userName ?? "viajero";

  const summaryPrices = useMemo(
    () => ({
      adult: offerings.adults ? prices.adult : 0,
      junior: offerings.juniors ? prices.junior : 0,
      child: offerings.children ? prices.child : 0,
    }),
    [offerings, prices],
  );

  return (
    <aside className="rp-booking-card">
      <header className="rp-booking-header">
        <Sparkles size={20} className="rp-booking-header-icon" />
        <div>
          <h2 className="rp-booking-title">Reserva tus lugares</h2>
          <p className="rp-booking-greeting">
            Hola, <strong>{firstName}</strong>. Arma tu grupo de viaje.
          </p>
        </div>
      </header>

      <div className="rp-booking-body">
        {noStock && (
          <div className="rp-alert rp-alert--error">
            Este paquete no tiene cupos disponibles por el momento.
          </div>
        )}

        {mensaje && (
          <div
            className={`rp-alert rp-alert--${mensaje.tipo === "success" ? "success" : "error"}`}
          >
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rp-form" id="rp-booking-form">
          <div className="rp-steppers-group">
            {offerings.adults && (
              <PassengerStepper
                label="Adultos"
                unitPrice={prices.adult}
                value={adults}
                min={1}
                max={maxForSimple("adults")}
                disabled={noStock}
                onChange={(v) => updateCount("adults", v)}
              />
            )}

            {offerings.juniors && (
              <PassengerStepper
                label="Juvenil"
                unitPrice={prices.junior}
                value={juniors}
                min={0}
                max={maxForSimple("juniors")}
                disabled={noStock}
                onChange={(v) => updateCount("juniors", v)}
              />
            )}

            {offerings.children && (
              <PassengerStepper
                label="Infantes"
                unitPrice={prices.child}
                value={children}
                min={0}
                max={maxForSimple("children")}
                disabled={noStock}
                onChange={(v) => updateCount("children", v)}
              />
            )}
          </div>

          <div className="rp-stock-bar">
            <div className="rp-stock-bar-track">
              <div
                className="rp-stock-bar-fill"
                style={{
                  width: `${pkg.stock > 0 ? Math.min(100, (totalPassengers / pkg.stock) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="rp-stock-hint">
              <strong>{totalPassengers}</strong> de <strong>{pkg.stock}</strong>{" "}
              cupos seleccionados
            </p>
          </div>

          <label className="rp-label">
            Notas adicionales (opcional)
            <textarea
              className="rp-textarea"
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Equipaje, habitaciones, preferencias..."
              disabled={noStock}
            />
          </label>

          <ReservationSummary
            counts={counts}
            prices={summaryPrices}
            compact
          />
        </form>
      </div>

      <footer className="rp-booking-footer">
        <div className="rp-booking-footer-total">
          <span className="rp-booking-footer-label">
            Total estimado
            {totalPassengers > 0 && (
              <small>
                {" "}
                · {totalPassengers}{" "}
                {totalPassengers === 1 ? "persona" : "personas"}
              </small>
            )}
          </span>
          <strong className="rp-booking-footer-amount">
            {formatMXN(previewTotal)}
          </strong>
        </div>
        <button
          type="submit"
          form="rp-booking-form"
          className="rp-submit"
          disabled={submitDisabled}
        >
          {submitting ? "Procesando..." : "Solicitar reservación"}
        </button>
      </footer>
    </aside>
  );
}
