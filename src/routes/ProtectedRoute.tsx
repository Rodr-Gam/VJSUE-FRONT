import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Protege rutas que solo puede ver el admin
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isCliente } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }
  if (!isAdmin) {
    if (isCliente) return <Navigate to="/cliente/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Protege rutas que solo puede ver el cliente
export function ClienteRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isCliente } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }
  if (!isCliente) {
    if (isAdmin) return <Navigate to="/admin/crear-paquete" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Protege rutas que puede ver cualquier usuario autenticado (admin o cliente)
export function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}