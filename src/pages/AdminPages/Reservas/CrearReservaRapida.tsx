import FlexibleReservationForm from "../../../components/Admin/reservations/FlexibleReservationForm";
import { QUICK_RESERVATION_FORM_CONFIG } from "../../../config/flexibleReservationConfig";

export default function CrearReservaRapida() {
  return <FlexibleReservationForm config={QUICK_RESERVATION_FORM_CONFIG} />;
}
