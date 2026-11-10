import { useState, useCallback, useRef, useEffect } from "react";
import type { ToastMessage } from "../components/common/Toast";

/**
 * Maneja el estado de un mensaje de éxito/error y lo oculta
 * automáticamente después de `duration` ms (3000 por defecto).
 *
 * Uso:
 *   const { mensaje, mostrarMensaje } = useToast();
 *   mostrarMensaje("Vuelo eliminado correctamente.", "success");
 *   <Toast mensaje={mensaje} />
 */
export function useToast(duration = 3000) {
  const [mensaje, setMensaje] = useState<ToastMessage | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarMensaje = useCallback(
    (texto: string, tipo: ToastMessage["tipo"] = "success") => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setMensaje({ texto, tipo });
      timeoutRef.current = setTimeout(() => setMensaje(null), duration);
    },
    [duration],
  );

  // Limpieza al desmontar el componente que usa el hook
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { mensaje, mostrarMensaje };
}
