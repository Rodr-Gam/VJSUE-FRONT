import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../../../api";

export interface ClientOption {
  id: number;
  name: string;
  last_name?: string | null;
  email?: string | null;
  state: string;
}

interface ClientSearchFieldProps {
  value: ClientOption | null;
  onChange: (client: ClientOption | null) => void;
  disabled?: boolean;
}

export default function ClientSearchField({
  value,
  onChange,
  disabled = false,
}: ClientSearchFieldProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ClientOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value) {
      setSearch(
        [value.name, value.last_name].filter(Boolean).join(" ") +
          (value.email ? ` (${value.email})` : ""),
      );
    }
  }, [value]);

  useEffect(() => {
    if (search.length < 2 || value) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/users", {
          params: { search, state: "active", per_page: 25 },
        });
        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
        setResults(list.filter((u: ClientOption) => u.state === "active"));
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [search, value]);

  const clearClient = () => {
    onChange(null);
    setSearch("");
    setOpen(false);
  };

  return (
    <div className="id-form-field id-client-search">
      <label className="id-form-label" htmlFor="id-client-search">
        Cliente (opcional)
      </label>
      <div className="id-client-input-wrap">
        <Search size={18} className="id-client-search-icon" aria-hidden="true" />
        <input
          id="id-client-search"
          type="text"
          className="id-form-control id-form-control--with-icon"
          placeholder="Buscar por nombre o email…"
          value={search}
          disabled={disabled}
          autoComplete="off"
          onChange={(e) => {
            onChange(null);
            setSearch(e.target.value);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 180);
          }}
        />
      </div>
      {value && (
        <button type="button" className="id-client-clear" onClick={clearClient} disabled={disabled}>
          Quitar cliente vinculado
        </button>
      )}
      {open && !value && (
        <ul className="id-client-dropdown" role="listbox">
          {loading && <li className="id-client-empty">Buscando…</li>}
          {!loading && results.length === 0 && (
            <li className="id-client-empty">Sin resultados</li>
          )}
          {!loading &&
            results.map((client) => (
              <li key={client.id}>
                <button
                  type="button"
                  className="id-client-option"
                  onClick={() => {
                    onChange(client);
                    setOpen(false);
                  }}
                >
                  {[client.name, client.last_name].filter(Boolean).join(" ")}
                  {client.email && <span>{client.email}</span>}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
