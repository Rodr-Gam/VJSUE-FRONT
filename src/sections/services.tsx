import { services } from "../data/services";


export default function ServicesSection() {
  return (
    <section id="servicios" className="lt-section lt-services-section">
      <div className="lt-services-inner">
        <div className="lt-services-header">
          <h2 className="lt-eyebrow lt-gold-eyebrow">Servicios</h2>
          <h3 className="lt-display lt-white">La Excelencia como Estándar</h3>
        </div>
        <div className="lt-services-grid">
          {services.map((s) => (
            <div key={s.title} className="lt-service-card">
              <div className="lt-service-icon-wrap">
                <span className="material-symbols-outlined lt-service-icon">{s.icon}</span>
              </div>
              <h4 className="lt-service-title">{s.title}</h4>
              <p className="lt-service-desc">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}