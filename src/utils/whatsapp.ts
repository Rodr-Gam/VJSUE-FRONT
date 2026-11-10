export const WHATSAPP_PHONE = "523320390269";

export const WHATSAPP_DEFAULT_MESSAGE =
  "Hola, me gustaría recibir información sobre sus paquetes de viaje.";

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(message: string): void {
  window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
}

export interface ContactFormData {
  name: string;
  email: string;
  destination: string;
  message: string;
}

export function buildContactWhatsAppMessage(data: ContactFormData): string {
  return [
    "Hola, me gustaría solicitar una cotización de viaje.",
    "",
    `Nombre: ${data.name.trim()}`,
    `Correo: ${data.email.trim()}`,
    `Destino de interés: ${data.destination.trim()}`,
    "",
    "Detalles del viaje:",
    data.message.trim(),
  ].join("\n");
}
