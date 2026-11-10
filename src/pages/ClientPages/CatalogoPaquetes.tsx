import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { packageService } from "../../packageService";
import { useAuth } from "../../hooks/useAuth";
import Navbar from "../../components/publicas/navCliente";
import Footer from "../../components/publicas/footerCliente";
import WhatsAppFAB from "../../components/publicas/WhatsApp";
import PackageCard from "../../components/packages/PackageCard";
import type { TravelPackage } from "../../types/package";
import { Compass } from "lucide-react";
import "../../styles/landingCliente/landing.css";
import "../../styles/CatalogoPaquetes.css";

function CatalogSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="cc-card-skeleton" aria-hidden="true">
          <div className="cc-card-skeleton-img" />
          <div className="cc-card-skeleton-body">
            <div className="cc-card-skeleton-line cc-card-skeleton-line--lg" />
            <div className="cc-card-skeleton-line" />
            <div className="cc-card-skeleton-line cc-card-skeleton-line--sm" />
          </div>
        </div>
      ))}
    </>
  );
}

export default function CatalogoPaquetes() {
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isCliente } = useAuth();

  const handleReservar = (packageId: number) => {
    const target = `/cliente/reservar/${packageId}`;

    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(target)}`);
      return;
    }

    if (!isCliente) {
      navigate("/login");
      return;
    }

    navigate(target);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fetchPublicPackages = async () => {
      try {
        setLoading(true);
        setError(null);
        setPackages(await packageService.getPublicPackages());
      } catch (err) {
        console.error("Error al cargar el catálogo público:", err);
        setError(
          "Por el momento no pudimos cargar los destinos turísticos. Inténtalo más tarde.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPublicPackages();
  }, []);

  const gridClass =
    packages.length === 1
      ? "cc-packages-grid cc-packages-grid--single"
      : "cc-packages-grid";

  return (
    <div className="lt-root cc-page">
      <Navbar scrolled={scrolled} />

      <main className="cc-main-container">
        <header className="cc-catalog-header">
          <p className="cc-eyebrow">Colección Elite</p>
          <h1 className="cc-title">Próximas Aventuras Disponibles</h1>
          <p className="cc-subtitle">
            Encuentra el viaje de tus sueños con salidas 100% confirmadas
          </p>
          {!loading && !error && packages.length > 0 && (
            <span className="cc-count-badge">
              {packages.length}{" "}
              {packages.length === 1 ? "paquete disponible" : "paquetes disponibles"}
            </span>
          )}
        </header>

        {loading && (
          <div className="cc-packages-grid">
            <CatalogSkeleton />
          </div>
        )}

        {!loading && error && (
          <div className="cc-status cc-error-box">
            <p>{error}</p>
            <button
              type="button"
              className="cc-retry-btn"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && packages.length === 0 && (
          <div className="cc-empty-catalog">
            <Compass size={40} className="cc-empty-icon" aria-hidden="true" />
            <h2>Sin paquetes por ahora</h2>
            <p>
              Estamos preparando nuevas aventuras. Vuelve pronto o contáctanos
              para armar tu viaje a medida.
            </p>
          </div>
        )}

        {!loading && !error && packages.length > 0 && (
          <div className={gridClass}>
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} onReservar={handleReservar} />
            ))}
          </div>
        )}
      </main>

      <WhatsAppFAB />
      <Footer />
    </div>
  );
}
