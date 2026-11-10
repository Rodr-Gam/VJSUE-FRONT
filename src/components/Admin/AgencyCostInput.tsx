import { formatAdminMoney } from "../../utils/adminFormat";
import { calcServiceProfit } from "../../utils/serviceProfit";

interface AgencyCostInputProps {
  value: string;
  providerCost: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function AgencyCostInput({
  value,
  providerCost,
  onChange,
  disabled = false,
}: AgencyCostInputProps) {
  const profit = calcServiceProfit(value, providerCost);

  return (
    <label className="R-label">
      Precio cliente
      <input
        type="number"
        step="0.0001"
        min="0"
        title="Precio cobrado al cliente (solo admin)"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="R-input"
        placeholder="Ej. 1500.00"
      />
      {profit !== null && (
        <span className="block text-xs font-semibold text-emerald-700 mt-1">
          Ganancia: ${formatAdminMoney(profit)}
        </span>
      )}
    </label>
  );
}
