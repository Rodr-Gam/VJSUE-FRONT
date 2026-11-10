import "../../styles/landingCliente/hero.css";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section id="inicio" className="lt-hero lt-section">
      <div className="lt-hero-bg">
        <img
          src="/images/destinations/inicio.png"
          alt="Maldives luxury villa at sunset"
        />
        <div className="lt-hero-gradient" />
      </div>
      <div className="lt-hero-content">
        <div className="lt-hero-text">
          <h1 className="lt-display">
            Todo viaje <span className="lt-gold-italic">Comienza</span> con un
            sueño.
          </h1>
          <p className="lt-hero-sub">
            Descubra mundos inexplorados con la mejor selección de viajes del
            mundo. Destinos que no solo se ven, se sienten.
          </p>
          <div className="lt-hero-btns">
            <Link to="/paquetes-disponibles" className="lt-btn-coral lt-btn-lg">
              Explorar Destinos
            </Link>
            <a href="#contacto" className="lt-btn-outline-gold lt-btn-lg">
              Solicitar Informes
            </a>{" "}
          </div>
        </div>
      </div>
      <div className="lt-scroll-indicator">
        <span className="lt-scroll-label">Explorar</span>
        <span className="material-symbols-outlined">expand_more</span>
      </div>
    </section>
  );
}
