import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Account, PassengerLedgerRow } from "../types/finance";
import { formatMXN } from "./reservationPricing";
import { formatAdminDate } from "./adminFormat";
import {
  passengerPaymentStatusLabel,
  passengerTypeLabel,
} from "./passengerPaymentSplit";
import {
  paymentMethodLabel,
  transactionTypeLabel,
} from "./financeLabels";
import { drawFlightChangeDisclaimer } from "./pdfFlightDisclaimer";

const NAVY: [number, number, number] = [25, 51, 85];
const GOLD: [number, number, number] = [211, 167, 98];
const SLATE: [number, number, number] = [51, 65, 85];
const MUTED: [number, number, number] = [100, 116, 139];
const ROW_ALT: [number, number, number] = [248, 250, 252];
const PAGE_MARGIN = 14;

function clientName(account: Account): string {
  const user = account.reservation?.user;
  if (!user) return "—";
  return [user.name, user.last_name].filter(Boolean).join(" ");
}

function drawHeader(doc: jsPDF, title: string, subtitle: string): number {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("VIAJES SUEÑA", PAGE_MARGIN, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GOLD);
  doc.text(subtitle, PAGE_MARGIN, 19);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 196, 14, { align: "right" });
  return 36;
}

function table(doc: jsPDF, y: number, head: string[], body: string[][]): number {
  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    theme: "grid",
    head: [head],
    body,
    styles: {
      fontSize: 9,
      textColor: SLATE,
      lineColor: [226, 232, 240],
    },
    headStyles: {
      fillColor: NAVY,
      textColor: GOLD,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: ROW_ALT },
  });
  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!
    .finalY + 6;
}

export function generatePassengerAccountPdf(
  account: Account,
  passenger: PassengerLedgerRow,
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const fullName = [passenger.name, passenger.last_name].filter(Boolean).join(" ");
  let y = drawHeader(
    doc,
    `Reserva #${account.reservation_id}`,
    "Estado de cuenta por pasajero",
  );

  y = table(doc, y, ["Campo", "Valor"], [
    ["Pasajero", fullName],
    ["Tipo", passengerTypeLabel[passenger.type] ?? passenger.type],
    ["Titular de reserva", clientName(account)],
    ["Paquete / destino", `${account.reservation?.package?.name ?? "—"} · ${account.reservation?.package?.city?.name ?? "—"}`],
    ["Salida", formatAdminDate(account.reservation?.departure_date)],
    ["Regreso", formatAdminDate(account.reservation?.return_date)],
    ["Importe asignado", formatMXN(passenger.amount_due)],
    ["Total pagado", formatMXN(passenger.paid_amount)],
    ["Saldo pendiente", formatMXN(passenger.balance_due)],
    ["Estado", passengerPaymentStatusLabel[passenger.status] ?? passenger.status],
  ]);

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text("Pagos registrados", PAGE_MARGIN, y);
  y += 6;

  if (passenger.movements.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text("Sin pagos asignados a este pasajero.", PAGE_MARGIN, y);
    y += 8;
  } else {
    table(
      doc,
      y,
      ["Fecha", "Importe", "Método", "Tipo", "Ref. pago"],
      passenger.movements.map((m) => [
        formatAdminDate(m.paid_at),
        formatMXN(m.amount),
        paymentMethodLabel[m.payment_method],
        transactionTypeLabel[m.transaction_type],
        `#${m.partial_payment_id}`,
      ]),
    );
    y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!
      .finalY + 6;
  }

  drawFlightChangeDisclaimer(doc, y);

  doc.save(
    `estado-cuenta-reserva-${account.reservation_id}-pasajero-${passenger.passenger_id}.pdf`,
  );
}

export function generateGeneralPassengerAccountPdf(account: Account): void {
  const ledger = account.passenger_ledger;
  if (!ledger?.enabled) return;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = drawHeader(
    doc,
    `Reserva #${account.reservation_id}`,
    "Estado de cuenta general · pagos por pasajero",
  );

  y = table(doc, y, ["Campo", "Valor"], [
    ["Titular", clientName(account)],
    ["Paquete", account.reservation?.package?.name ?? "—"],
    ["Destino", account.reservation?.package?.city?.name ?? "—"],
    ["Salida", formatAdminDate(account.reservation?.departure_date)],
    ["Regreso", formatAdminDate(account.reservation?.return_date)],
    ["Total del viaje", formatMXN(Number(account.total_amount))],
    ["Total pagado (cuenta)", formatMXN(Number(account.paid_amount))],
    ["Saldo pendiente (cuenta)", formatMXN(Number(account.balance_due))],
    [
      "Pagos sin asignar a pasajero",
      formatMXN(ledger.unassigned_paid),
    ],
  ]);

  y = table(
    doc,
    y,
    ["Pasajero", "Tipo", "Asignado", "Pagado", "Pendiente", "Estado"],
    ledger.passengers.map((p) => [
      [p.name, p.last_name].filter(Boolean).join(" "),
      passengerTypeLabel[p.type] ?? p.type,
      formatMXN(p.amount_due),
      formatMXN(p.paid_amount),
      formatMXN(p.balance_due),
      passengerPaymentStatusLabel[p.status] ?? p.status,
    ]),
  );

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!
      .finalY + 6;
  drawFlightChangeDisclaimer(doc, finalY);

  doc.save(`estado-cuenta-general-reserva-${account.reservation_id}.pdf`);
}