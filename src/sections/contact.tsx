import { useState, type FormEvent } from "react";
import {
  buildContactWhatsAppMessage,
  openWhatsApp,
} from "../utils/whatsapp";

const INITIAL_FORM = {
  name: "",
  email: "",
  destination: "",
  message: "",
};

export default function ContactSection() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();
    const destination = form.destination.trim();
    const message = form.message.trim();

    if (!name || !email || !destination || !message) {
      setError("Por favor completa todos los campos del formulario.");
      return;
    }

    openWhatsApp(
      buildContactWhatsAppMessage({ name, email, destination, message }),
    );
    setForm(INITIAL_FORM);
    setError(null);
  };

  return (
    <section id="contacto" className="lt-section lt-contact">
      <div className="lt-contact-inner">
        <div className="lt-contact-header">
          <p className="lt-eyebrow lt-coral">CONTACTO</p>

          <h2 className="lt-display lt-primary">
            Planeemos tu próximo
            <span className="lt-text-stroke-gold"> viaje</span>
          </h2>

          <p className="lt-contact-description">
            Cuéntanos qué destino tienes en mente y nuestro equipo preparará una
            propuesta personalizada para que disfrutes una experiencia
            inolvidable.
          </p>
        </div>

        <div className="lt-contact-content">
          <form className="lt-contact-form" onSubmit={handleSubmit} noValidate>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nombre completo"
              autoComplete="name"
              required
            />

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Correo electrónico"
              autoComplete="email"
              required
            />

            <input
              type="text"
              name="destination"
              value={form.destination}
              onChange={handleChange}
              placeholder="Destino de interés"
              required
            />

            <textarea
              name="message"
              rows={5}
              value={form.message}
              onChange={handleChange}
              placeholder="Cuéntanos cómo imaginas tu viaje..."
              required
            />

            {error && <p className="lt-contact-form-error">{error}</p>}

            <button type="submit" className="lt-btn-primary">
              Solicitar cotización por WhatsApp
            </button>
          </form>

          <div className="lt-contact-card">
            <div className="lt-contact-item">
              <span className="material-symbols-outlined">call</span>

              <div>
                <h4>Teléfono</h4>
                <p>+52 33 2039 0269</p>
              </div>
            </div>

            <div className="lt-contact-item">
              <span className="material-symbols-outlined">mail</span>

              <div>
                <h4>Correo</h4>
                <p>viajessuena@gmail.com</p>
              </div>
            </div>

            <div className="lt-contact-item">
              <span className="material-symbols-outlined">location_on</span>

              <div>
                <h4>Ubicación</h4>
                <p>Col. Parques del Castillo, El Salto, Jal.</p>
                <div className="lt-contact-map">
                  <iframe
                    src="https://maps.google.com/maps?q=Col.+Parques+del+Castillo,+El+Salto,+Jalisco&hl=es&z=14&output=embed"
                    width="100%"
                    height="220"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    title="Col. Parques del Castillo, El Salto"
                  />
                </div>
              </div>
            </div>
            <div className="lt-contact-extra">
              <div>
                <span className="material-symbols-outlined">check_circle</span>
                Atención personalizada.
              </div>

              <div>
                <span className="material-symbols-outlined">schedule</span>
                Respuesta en menos de 24 horas.
              </div>

              <div>
                <span className="material-symbols-outlined">verified</span>
                Cotización sin compromiso.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
