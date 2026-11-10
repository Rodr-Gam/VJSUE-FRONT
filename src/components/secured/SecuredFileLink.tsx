import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { openSecuredFile } from "../../utils/securedFiles";

interface SecuredFileLinkProps {
  fileRef: string;
  className?: string;
  label?: string;
}

export default function SecuredFileLink({
  fileRef,
  className = "",
  label = "Ver archivo",
}: SecuredFileLinkProps) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      className={className}
      disabled={loading}
      onClick={async () => {
        try {
          setLoading(true);
          await openSecuredFile(fileRef);
        } catch {
          window.alert("No se pudo abrir el archivo. Vuelve a iniciar sesión si es necesario.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <ExternalLink size={14} aria-hidden="true" />
      {label ? (loading ? "Abriendo…" : label) : null}
    </button>
  );
}
