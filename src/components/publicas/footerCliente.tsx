import { FaFacebookF, FaInstagram, FaEnvelope } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="lt-footer">
      <div className="lt-footer-inner">
        <div className="lt-footer-brand">
          <div className="lt-logo">VIAJES • SUEÑA</div>
          <p className="lt-footer-desc">
            Tu guía en el mundo de los viajes premium. Nos encargamos de planear
            experiencias increíbles y personalizadas, con una atención al
            detalle impecable.{" "}
          </p>
          <div className="lt-footer-socials">
            <a
              href="https://www.facebook.com/profile.php?id=100064242276275&mibextid=ZbWKwL"
              target="_blank"
              rel="noreferrer"
            >
              <FaFacebookF />
            </a>

            <a
              href="https://www.instagram.com/agencia_de_viajes_suena?igsh=MWdlNHltcm9janFsdw=="
              target="_blank"
              rel="noreferrer"
            >
              <FaInstagram />
            </a>

            <a href="mailto:viajessuena@gmail.com">
              <FaEnvelope />
            </a>
          </div>
        </div>
        <div className="lt-footer-col">
          <h4 className="lt-footer-col-title">Legal</h4>
          <ul className="lt-footer-links">
            {["Privacidad", "Términos de Servicio", "Cookies"].map((l) => (
              <li key={l}>
                <a href="#">{l}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="lt-footer-bottom">
        <p>© 2026 ViajesSueña. La excelencia en cada horizonte.</p>
        <div className="lt-footer-regions">
          {["MX"].map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
