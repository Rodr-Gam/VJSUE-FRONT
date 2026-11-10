export interface ToastMessage {
  texto: string;
  tipo: "success" | "error";
}

interface ToastProps {
  mensaje: ToastMessage | null;
}

export default function Toast({ mensaje }: ToastProps) {
  if (!mensaje) return null;

  return (
    <div
      className={`cc-alert cc-alert--${mensaje.tipo} fixed bottom-4 right-4 z-50`}
    >
      <span className="cc-alert-icon">
        {mensaje.tipo === "success" ? "✓" : "!"}
      </span>
      <span>{mensaje.texto}</span>
    </div>
  );
}
