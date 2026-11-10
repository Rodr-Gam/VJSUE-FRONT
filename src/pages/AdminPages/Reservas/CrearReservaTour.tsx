import FlexibleReservationForm from "../../../components/Admin/reservations/FlexibleReservationForm";
import { TOUR_RESERVATION_FORM_CONFIG } from "../../../config/flexibleReservationConfig";

export default function CrearReservaTour() {
  return <FlexibleReservationForm config={TOUR_RESERVATION_FORM_CONFIG} />;
}
