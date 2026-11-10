import type { SupplierBreakdownLine } from "../../../types/supplierFinance";
import { formatMXN } from "../../../utils/reservationPricing";

interface SupplierBreakdownListProps {
  lines: SupplierBreakdownLine[];
  className?: string;
}

export default function SupplierBreakdownList({
  lines,
  className = "adm-finance-breakdown adm-finance-breakdown--card",
}: SupplierBreakdownListProps) {
  if (lines.length === 0) {
    return (
      <p className="adm-empty text-sm">No hay montos a proveedor registrados.</p>
    );
  }

  return (
    <ul className={className}>
      {lines.map((line) => (
        <li key={line.key}>
          <span>
            {line.label}
            {line.supplier_name ? (
              <span className="adm-breakdown-sub"> · {line.supplier_name}</span>
            ) : null}
            <span className="adm-breakdown-desc">{line.description}</span>
          </span>
          <span>{formatMXN(Number(line.amount))}</span>
        </li>
      ))}
    </ul>
  );
}
