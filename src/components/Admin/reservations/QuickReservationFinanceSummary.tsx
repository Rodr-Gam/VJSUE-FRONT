import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { formatMXN } from "../../../utils/reservationPricing";
import {
  buildQuickReservationFinanceSummary,
  type QuickReservationFinanceInput,
  type QuickReservationFinanceLine,
} from "../../../utils/quickReservationFinance";

interface QuickReservationFinanceSummaryProps
  extends QuickReservationFinanceInput {}

function money(value: number): string {
  return formatMXN(value);
}

function profitClass(value: number, extra = ""): string {
  const base = `R-finance-profit${extra ? ` ${extra}` : ""}`;
  return value < 0 ? `${base} R-finance-profit--negative` : base;
}

function platformCell(line: QuickReservationFinanceLine): string {
  if (line.key !== "package") return "—";
  return line.platformCost > 0 ? money(line.platformCost) : "—";
}

function bonusCell(line: QuickReservationFinanceLine): string {
  if (!line.included && line.key !== "package") return "—";
  if (line.key === "package") return money(line.bonusDiscount);
  return line.bonusDiscount > 0 ? money(line.bonusDiscount) : "—";
}

function rowClass(line: QuickReservationFinanceLine): string {
  if (line.key === "package") return "R-finance-row--package";
  if (!line.included) return "R-finance-row--muted";
  return "";
}

export default function QuickReservationFinanceSummary(
  props: QuickReservationFinanceSummaryProps,
) {
  const summary = useMemo(
    () => buildQuickReservationFinanceSummary(props),
    [props],
  );

  const { lines, servicesSubtotal, totals } = summary;
  const flightTransportLines = lines.filter(
    (line) => line.key === "flight" || line.key === "transport",
  );
  const flightTransportActive = flightTransportLines.some((line) => line.included);
  const flightTransportSubtotal = flightTransportLines.reduce(
    (acc, line) => ({
      platformCost: acc.platformCost + line.platformCost,
      bonusDiscount: acc.bonusDiscount + line.bonusDiscount,
      providerCost: acc.providerCost + line.providerCost,
      clientCost: acc.clientCost + line.clientCost,
      profitGross: acc.profitGross + line.profitGross,
      profitNet: acc.profitNet + line.profitNet,
    }),
    {
      platformCost: 0,
      bonusDiscount: 0,
      providerCost: 0,
      clientCost: 0,
      profitGross: 0,
      profitNet: 0,
    },
  );

  return (
    <div className="R-card-f R-finance-summary R-finance-summary--polished">
      <div className="R-finance-summary-head">
        <span className="R-finance-summary-icon" aria-hidden="true">
          <Wallet size={20} />
        </span>
        <div className="R-finance-summary-head-text">
          <h3 className="R-finance-summary-title">Desglose financiero</h3>
          <p className="R-finance-summary-sub">
            Resumen en vivo de plataforma, bono, pagos, cobros y ganancias de
            esta reserva.
          </p>
        </div>
      </div>

      <ul className="R-finance-legend" aria-label="Referencias del desglose">
        <li>
          <span className="R-finance-legend-dot R-finance-legend-dot--platform" />
          Plataforma y reparto por edad
        </li>
        <li>
          <span className="R-finance-legend-dot R-finance-legend-dot--profit" />
          Ganancia = cobro − proveedor
        </li>
        <li>
          <span className="R-finance-legend-dot R-finance-legend-dot--net" />
          Ganancia libre = ganancia − bono
        </li>
      </ul>

      <div className="R-finance-table-wrap">
        <table className="R-finance-table R-finance-table--wide R-finance-table--polished">
          <thead>
            <tr>
              <th className="R-finance-th-concept">Concepto</th>
              <th className="R-finance-th-num">Costo plataforma</th>
              <th className="R-finance-th-num">Bono / desc.</th>
              <th className="R-finance-th-num">Pago proveedor</th>
              <th className="R-finance-th-num">Cobro cliente</th>
              <th className="R-finance-th-num R-finance-th-profit">Ganancia</th>
              <th className="R-finance-th-num R-finance-th-profit">Gan. libre</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.key} className={rowClass(line)}>
                <td className="R-finance-td-concept">
                  <strong>{line.label}</strong>
                  {!line.included && line.key !== "package" ? (
                    <span className="R-finance-tag">No incluido</span>
                  ) : line.detail ? (
                    <span className="R-finance-detail">{line.detail}</span>
                  ) : null}
                </td>
                <td className="R-finance-num">{platformCell(line)}</td>
                <td className="R-finance-num">{bonusCell(line)}</td>
                <td className="R-finance-num">
                  {line.included
                    ? line.providerCost > 0 || line.key === "package"
                      ? money(line.providerCost)
                      : "—"
                    : "—"}
                </td>
                <td className="R-finance-num R-finance-num--client">
                  {line.included ? money(line.clientCost) : "—"}
                </td>
                <td
                  className={`R-finance-num ${
                    line.included
                      ? profitClass(line.profitGross)
                      : "R-finance-profit"
                  }`}
                >
                  {line.included ? money(line.profitGross) : "—"}
                </td>
                <td
                  className={`R-finance-num ${
                    line.included
                      ? profitClass(line.profitNet, "R-finance-profit--libre")
                      : "R-finance-profit R-finance-profit--libre"
                  }`}
                >
                  {line.included ? money(line.profitNet) : "—"}
                </td>
              </tr>
            ))}

            {flightTransportActive && (
              <tr className="R-finance-row--subtotal">
                <td className="R-finance-td-concept">
                  <strong>Vuelo + transporte</strong>
                </td>
                <td className="R-finance-num">—</td>
                <td className="R-finance-num">
                  {money(flightTransportSubtotal.bonusDiscount)}
                </td>
                <td className="R-finance-num">
                  {money(flightTransportSubtotal.providerCost)}
                </td>
                <td className="R-finance-num R-finance-num--client">
                  {money(flightTransportSubtotal.clientCost)}
                </td>
                <td
                  className={`R-finance-num ${profitClass(flightTransportSubtotal.profitGross)}`}
                >
                  {money(flightTransportSubtotal.profitGross)}
                </td>
                <td
                  className={`R-finance-num ${profitClass(
                    flightTransportSubtotal.profitNet,
                    "R-finance-profit--libre",
                  )}`}
                >
                  {money(flightTransportSubtotal.profitNet)}
                </td>
              </tr>
            )}

            {servicesSubtotal.hasServices && (
              <tr className="R-finance-row--subtotal">
                <td className="R-finance-td-concept">
                  <strong>Todos los servicios</strong>
                  <span className="R-finance-detail">
                    Vuelo, transporte y hotel incluidos
                  </span>
                </td>
                <td className="R-finance-num">
                  {money(servicesSubtotal.platformCost)}
                </td>
                <td className="R-finance-num">
                  {money(servicesSubtotal.bonusDiscount)}
                </td>
                <td className="R-finance-num">
                  {money(servicesSubtotal.providerCost)}
                </td>
                <td className="R-finance-num R-finance-num--client">
                  {money(servicesSubtotal.clientCost)}
                </td>
                <td
                  className={`R-finance-num ${profitClass(servicesSubtotal.profitGross)}`}
                >
                  {money(servicesSubtotal.profitGross)}
                </td>
                <td
                  className={`R-finance-num ${profitClass(
                    servicesSubtotal.profitNet,
                    "R-finance-profit--libre",
                  )}`}
                >
                  {money(servicesSubtotal.profitNet)}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="R-finance-td-concept">
                <strong>Total de la reserva</strong>
              </td>
              <td className="R-finance-num">{money(totals.platformCost)}</td>
              <td className="R-finance-num">{money(totals.bonusDiscount)}</td>
              <td className="R-finance-num">{money(totals.providerCost)}</td>
              <td className="R-finance-num R-finance-num--client">
                {money(totals.clientCost)}
              </td>
              <td
                className={`R-finance-num ${profitClass(totals.profitGross, "R-finance-profit--total")}`}
              >
                {money(totals.profitGross)}
              </td>
              <td
                className={`R-finance-num ${profitClass(
                  totals.profitNet,
                  "R-finance-profit--total R-finance-profit--libre",
                )}`}
              >
                {money(totals.profitNet)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="R-finance-note">
        Los importes se actualizan al capturar precios, plataforma, bono y
        servicios. El porcentaje elegido (17% o 18%) sobre plataforma aparece en
        el bloque de precios por edad; aquí la ganancia sigue cobro al cliente
        menos pago a proveedor.
      </p>
    </div>
  );
}
