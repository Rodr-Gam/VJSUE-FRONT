import { useAuth } from "../hooks/useAuth";
import AdminLayout from "../layouts/AdminLayout";
import NavprivClient from "../components/privadasCliente/NavPrivClient";
import PerfilUsuario from "../components/Admin/PerfilUsuario";
import "../styles/PerfilCliente.css";

export default function Perfil() {
  const { isAdmin, isCliente, user } = useAuth();

  if (isAdmin) {
    const firstName = user?.name?.split(" ")[0] || "Admin";

    return (
      <AdminLayout>
        <div className="pf-admin-shell">
          <header className="pf-admin-header">
            <span className="pf-eyebrow">Mi cuenta</span>
            <h1 className="pf-title">
              Hola, <span>{firstName}</span>
            </h1>
            <p className="pf-subtitle">
              Administra tus datos personales y credenciales de acceso al panel.
            </p>
          </header>
          <PerfilUsuario variant="admin" />
        </div>
      </AdminLayout>
    );
  }

  if (isCliente) {
    const firstName = user?.name?.split(" ")[0] || "Viajero";

    return (
      <div className="pf-page">
        <NavprivClient />
        <main className="pf-main">
          <div className="pf-container">
            <header className="pf-header">
              <span className="pf-eyebrow">Mi cuenta</span>
              <h1 className="pf-title">
                Hola, <span>{firstName}</span>
              </h1>
              <p className="pf-subtitle">
                Administra tus datos personales, teléfono y contraseña de acceso.
              </p>
            </header>
            <PerfilUsuario variant="cliente" />
          </div>
        </main>
      </div>
    );
  }

  return null;
}
