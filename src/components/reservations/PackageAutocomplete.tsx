import { useState } from "react";

export interface PackageOption {
  id: number;
  name: string;
  status: "active" | "inactive";
}

interface PackageAutocompleteProps {
  packages: PackageOption[];
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (pkg: PackageOption) => void;
  onClear?: () => void;
  label?: string;
}

export default function PackageAutocomplete({
  packages,
  search,
  onSearchChange,
  onSelect,
  onClear,
  label = "Paquete",
}: PackageAutocompleteProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <label className="R-label" style={{ position: "relative" }}>
      {label}
      <input
        type="text"
        className="R-input"
        placeholder="Buscar paquete por nombre..."
        value={search}
        onChange={(e) => {
          onSearchChange(e.target.value);
          onClear?.();
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
      />
      {showDropdown && search.length >= 1 && (
        <ul
          style={{ position: "absolute", width: "100%", zIndex: 50 }}
          className="border border-gray-200 rounded-md bg-white shadow max-h-48 overflow-y-auto"
        >
          {filtered.length > 0 ? (
            filtered.map((pkg) => (
              <li
                key={pkg.id}
                className="px-3 py-2 hover:bg-[#d3a762]/10 cursor-pointer text-sm flex items-center justify-between gap-2"
                onMouseDown={() => {
                  onSelect(pkg);
                  setShowDropdown(false);
                }}
              >
                <span>{pkg.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    pkg.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {pkg.status === "active" ? "Activo" : "Privado"}
                </span>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-gray-400 text-sm">
              Sin resultados
            </li>
          )}
        </ul>
      )}
    </label>
  );
}