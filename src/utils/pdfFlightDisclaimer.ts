import type { jsPDF } from "jspdf";

const MUTED: [number, number, number] = [71, 85, 105];
const NAVY: [number, number, number] = [25, 51, 85];

export const FLIGHT_CHANGE_DISCLAIMER_TITLE = "Cambios y cancelaciones:";
export const FLIGHT_CHANGE_DISCLAIMER_BODY =
  "Cualquier cambio o cancelación de vuelos será responsabilidad de la aerolínea, conforme a sus políticas, términos y condiciones. La agencia de viajes no se hace responsable de modificaciones, cancelaciones o cargos adicionales establecidos por la aerolínea.";

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 18) {
    doc.addPage();
    return 20;
  }
  return y;
}

/** Aviso legal de vuelos (caja destacada) para PDFs descargables. */
export function drawFlightChangeDisclaimer(
  doc: jsPDF,
  y: number,
  margin = 14,
  width = 182,
): number {
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  const bodyLines = doc.splitTextToSize(FLIGHT_CHANGE_DISCLAIMER_BODY, width - 8);
  const boxH = 8 + bodyLines.length * 4.2;
  y = ensureSpace(doc, y, boxH + 6);

  doc.setFillColor(255, 251, 245);
  doc.setDrawColor(211, 167, 98);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, width, boxH, 2, 2, "FD");

  let textY = y + 5.5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text(FLIGHT_CHANGE_DISCLAIMER_TITLE, margin + 4, textY);
  textY += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  bodyLines.forEach((line: string) => {
    doc.text(line, margin + 4, textY);
    textY += 4.2;
  });

  return y + boxH + 6;
}