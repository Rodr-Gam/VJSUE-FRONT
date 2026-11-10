import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Reservation } from "../types/reservation";
import type { Account, ScheduledPayment } from "../types/finance";
import type { Passenger } from "../types/passenger";
import {
  buildServiceCostLines,
  computePackageSubtotal,
  computeReservationDisplayTotal,
  formatMXN,
  formatPassengerSummary,
  getReservationPassengerCounts,
} from "./reservationPricing";
import { getReservationStateLabel } from "./reservationStatus";
import { formatAdminDate } from "./adminFormat";
import { accountStateLabel } from "./financeLabels";
import {
  getHotelCheckInOutLabel,
  getHotelDestinationLabel,
} from "./reservationServices";

type ReservationPdfSource = Reservation & {
  user?: { name?: string; last_name?: string; email?: string };
  package?: {
    name?: string;
    city?: { name?: string };
    duration?: string;
  };
  passengers?: Passenger[];
};

type JsPdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

const PASSENGER_TYPE_LABEL: Record<string, string> = {
  adult: "Adulto",
  junior: "Juvenil",
  child: "Menor",
};

const NAVY: [number, number, number] = [25, 51, 85];
const GOLD: [number, number, number] = [211, 167, 98];
const SLATE: [number, number, number] = [51, 65, 85];
const MUTED: [number, number, number] = [100, 116, 139];
const ROW_ALT: [number, number, number] = [248, 250, 252];
const PAID_GREEN: [number, number, number] = [21, 128, 61];
const DUE_ORANGE: [number, number, number] = [180, 83, 9];

const PAGE_MARGIN = 14;
const CONTENT_WIDTH = 182;

function clientName(reservation: ReservationPdfSource): string {
  const user = reservation.user;
  if (!user) return "—";
  return [user.name, user.last_name].filter(Boolean).join(" ");
}

function tableFinalY(doc: jsPDF): number {
  return (doc as JsPdfWithTable).lastAutoTable?.finalY ?? PAGE_MARGIN;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 16) {
    doc.addPage();
    return 20;
  }
  return y;
}

function drawPageHeader(doc: jsPDF, reservation: ReservationPdfSource): number {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text("VIAJES SUEÑA", PAGE_MARGIN, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GOLD);
  doc.text("Resumen de reserva para el cliente", PAGE_MARGIN, 19);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`Reserva #${reservation.id}`, 196, 12, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    getReservationStateLabel(String(reservation.state)),
    196,
    18,
    { align: "right" },
  );

  return 36;
}

function sectionTitle(doc: jsPDF, y: number, title: string): number {
  y = ensureSpace(doc, y, 12);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(PAGE_MARGIN, y, PAGE_MARGIN + CONTENT_WIDTH, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(title, PAGE_MARGIN, y);
  return y + 6;
}

function baseTableOptions(startY: number) {
  return {
    startY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    theme: "grid" as const,
    styles: {
      fontSize: 9,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      textColor: SLATE,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: NAVY,
      textColor: GOLD,
      fontStyle: "bold" as const,
      fontSize: 8.5,
    },
    alternateRowStyles: { fillColor: ROW_ALT },
  };
}

function keyValueTable(
  doc: jsPDF,
  y: number,
  rows: [string, string][],
): number {
  y = ensureSpace(doc, y, 16);
  autoTable(doc, {
    ...baseTableOptions(y),
    head: [],
    body: rows.map(([label, value]) => [label, value]),
    columnStyles: {
      0: {
        cellWidth: 42,
        fontStyle: "bold",
        textColor: MUTED,
        fontSize: 8,
      },
      1: { fontStyle: "bold", textColor: SLATE },
    },
  });
  return tableFinalY(doc) + 6;
}

function financeSummaryBoxes(
  doc: jsPDF,
  y: number,
  total: number,
  paid: number,
  balance: number,
): number {
  y = ensureSpace(doc, y, 22);
  const gap = 4;
  const boxW = (CONTENT_WIDTH - gap * 2) / 3;
  const boxes: {
    label: string;
    value: string;
    fill: [number, number, number];
    text: [number, number, number];
  }[] = [
    { label: "Total del viaje", value: formatMXN(total), fill: ROW_ALT, text: NAVY },
    { label: "Pagado", value: formatMXN(paid), fill: [236, 253, 245], text: PAID_GREEN },
    { label: "Pendiente", value: formatMXN(balance), fill: [255, 247, 237], text: DUE_ORANGE },
  ];

  boxes.forEach((box, i) => {
    const x = PAGE_MARGIN + i * (boxW + gap);
    doc.setFillColor(...box.fill);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, boxW, 18, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(box.label.toUpperCase(), x + 4, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...box.text);
    doc.text(box.value, x + 4, y + 14);
  });

  return y + 24;
}

function planInstallments(account: Account | null): ScheduledPayment[] {
  if (!account?.scheduled_payments?.length) return [];
  const plan = account.scheduled_payments.filter(
    (p) => p.is_plan_installment !== false,
  );
  const list = plan.length > 0 ? plan : account.scheduled_payments;
  return [...list].sort((a, b) => {
    const seqA = a.sequence ?? 0;
    const seqB = b.sequence ?? 0;
    if (seqA !== seqB) return seqA - seqB;
    return String(a.due_date).localeCompare(String(b.due_date));
  });
}

export function generateReservationPdf(
  reservation: ReservationPdfSource,
  account: Account | null,
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = drawPageHeader(doc, reservation);

  const city = reservation.package?.city?.name ?? "Destino";
  const packageName = reservation.package?.name ?? "Paquete";
  const counts = getReservationPassengerCounts(reservation);
  const displayTotal = computeReservationDisplayTotal(reservation);
  const packageSubtotal = computePackageSubtotal(reservation);
  const serviceLines = buildServiceCostLines(reservation);

  const accountTotal = account
    ? Number(account.total_amount) || displayTotal
    : displayTotal;
  const paid = account ? Number(account.paid_amount) || 0 : 0;
  const balance = account
    ? Number(account.balance_due) || Math.max(0, accountTotal - paid)
    : Math.max(0, accountTotal - paid);

  y = sectionTitle(doc, y, "Datos del viaje");
  y = keyValueTable(doc, y, [
    ["Destino", city],
    ["Paquete / tour", packageName],
    ["Cliente titular", clientName(reservation)],
    ["Pasajeros", formatPassengerSummary(counts)],
    ["Lugares", String(reservation.reserved_seats ?? "—")],
    ["Salida", formatAdminDate(reservation.departure_date)],
    ["Regreso", formatAdminDate(reservation.return_date)],
    ...(reservation.package?.duration
      ? ([["Duración", reservation.package.duration]] as [string, string][])
      : []),
  ]);

  y = sectionTitle(doc, y, "Servicios incluidos");
  const flightName =
    reservation.flight?.airline_name?.trim() || "Sin aerolínea asignada";
  const flightDetail =
    reservation.flight?.flight_schedule?.trim() || "Itinerario pendiente";
  const transportCo =
    reservation.transport?.company?.trim() || "Sin transporte asignado";
  const transportTime =
    reservation.transport?.horary?.trim() || "Horario pendiente";
  const hotelName = reservation.hotel?.name?.trim() || "Sin hotel asignado";
  const hotelExtra = [
    getHotelCheckInOutLabel(reservation.hotel),
    getHotelDestinationLabel(reservation.hotel),
  ]
    .filter(Boolean)
    .join(" · ");

  y = keyValueTable(doc, y, [
    ["Vuelo", `${flightName} · ${flightDetail}`],
    ["Transporte", `${transportCo} · ${transportTime}`],
    ["Hotel", `${hotelName}${hotelExtra ? ` · ${hotelExtra}` : ""}`],
  ]);

  y = sectionTitle(doc, y, "Pasajeros que viajan");
  const passengers = reservation.passengers ?? [];
  if (passengers.length === 0) {
    y = keyValueTable(doc, y, [["Listado", "Aún no hay pasajeros registrados."]]);
  } else {
    y = ensureSpace(doc, y, 20);
    autoTable(doc, {
      ...baseTableOptions(y),
      head: [["#", "Nombre completo", "Tipo"]],
      body: passengers.map((p, index) => [
        String(index + 1),
        [p.name, p.last_name].filter(Boolean).join(" "),
        PASSENGER_TYPE_LABEL[p.type] ?? p.type,
      ]),
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 120 },
        2: { cellWidth: 28 },
      },
    });
    y = tableFinalY(doc) + 8;
  }

  y = sectionTitle(doc, y, "Pagos y abonos");
  if (account) {
    y = keyValueTable(doc, y, [
      [
        "Estado de cuenta",
        accountStateLabel[account.state] ?? account.state,
      ],
    ]);
  }

  y = ensureSpace(doc, y, 14);
  autoTable(doc, {
    ...baseTableOptions(y),
    head: [["Concepto", "Importe"]],
    body: [
      ["Paquete", formatMXN(packageSubtotal)],
      ...serviceLines.map((line) => [line.label, formatMXN(line.amount)]),
    ],
    columnStyles: {
      0: { cellWidth: 130 },
      1: { halign: "right", fontStyle: "bold" },
    },
  });
  y = tableFinalY(doc) + 4;

  y = financeSummaryBoxes(doc, y, accountTotal, paid, balance);

  const installments = planInstallments(account);
  if (installments.length > 0) {
    const planLabel = account?.payment_plan_installments
      ? `Plan de pagos · ${account.payment_plan_installments} parcialidades`
      : "Plan de pagos";
    y = sectionTitle(doc, y, planLabel);

    y = ensureSpace(doc, y, 20);
    autoTable(doc, {
      ...baseTableOptions(y),
      head: [["#", "Vencimiento", "Importe", "Abonado", "Pendiente"]],
      body: installments.map((row, index) => {
        const amount = Number(row.amount) || 0;
        const settled = Number(row.amount_settled) || 0;
        const pending = Math.max(0, amount - settled);
        return [
          String(row.sequence ?? index + 1),
          formatAdminDate(row.due_date),
          formatMXN(amount),
          formatMXN(settled),
          formatMXN(pending),
        ];
      }),
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right", fontStyle: "bold" },
      },
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    const footerY = doc.internal.pageSize.getHeight() - 8;
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      `Viajes Sueña · Generado ${new Date().toLocaleString("es-MX")}`,
      PAGE_MARGIN,
      footerY,
    );
    doc.text(`Página ${page} de ${pageCount}`, 196, footerY, { align: "right" });
  }

  doc.save(`reserva-${reservation.id}-viajes-suena.pdf`);
}
