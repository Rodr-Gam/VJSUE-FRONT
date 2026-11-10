import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { packageService } from "../../packageService";
import { useAuth } from "../../hooks/useAuth";
import NavPrivClient from "../../components/privadasCliente/NavPrivClient";
import PackageDetailView from "../../components/packages/PackageDetailView";
import PackageBookingPanel from "../../components/reservations/PackageBookingPanel";
import type { TravelPackage } from "../../types/package";
import "../../styles/Cliente.css";
import "../../styles/ReservarPaquete.css";

export default function ReservarPaquete() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [pkg, setPkg] = useState<TravelPackage | null>(null);
  const [loadingPkg, setLoadingPkg] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        setLoadingPkg(true);
        const found = await packageService.getPublicPackageById(Number(id));
        if (!found) {
          setError("Este paquete ya no está disponible.");
          return;
        }
        setPkg(found);
      } catch {
        setError("No pudimos cargar la información del paquete.");
      } finally {
        setLoadingPkg(false);
      }
    };

    fetchPackage();
  }, [id]);

  return (
    <main className="rp-page">
      <NavPrivClient />

      <div className="rp-content">
        <Link to="/paquetes-disponibles" className="rp-back-link">
          <ArrowLeft size={18} aria-hidden="true" />
          Volver al catálogo de paquetes
        </Link>

        {loadingPkg && (
          <div className="rp-loading">
            <div className="rp-loading-spinner" />
            <p>Cargando detalles del paquete...</p>
          </div>
        )}

        {error && (
          <div className="rp-alert rp-alert--error">
            {error}{" "}
            <Link to="/paquetes-disponibles" className="rp-inline-link">
              Volver al catálogo
            </Link>
          </div>
        )}

        {!loadingPkg && pkg && (
          <div className="rp-detail-grid">
            <PackageDetailView pkg={pkg} />
            <PackageBookingPanel pkg={pkg} userName={user?.name} />
          </div>
        )}
      </div>
    </main>
  );
}
