import { testimonialAvatars } from "../data/testimonial";

export default function TestimonialsSection() {
  return (
    <section id="nosotros" className="lt-section lt-testimonials">
      <div className="lt-testimonials-inner">
        <div className="lt-testimonials-left">
          <h2 className="lt-eyebrow lt-coral">¿POR QUÉ ELEGIRNOS?</h2>

          <h3 className="lt-display lt-primary">
            Más que una Agencia,
            <br />
            Creamos Experiencias{" "}
            <span className="lt-text-stroke-gold">Inolvidables</span>
          </h3>

          <p className="lt-testimonials-body">
            En Viajes Sueña nos encargamos de cada detalle para que disfrutes
            una experiencia sin preocupaciones. Desde la planeación hasta tu
            regreso, estamos contigo en cada etapa del viaje.
          </p>

          <div className="lt-avatars">
            {testimonialAvatars.map((src, i) => (
              <img key={i} src={src} alt="client" className="lt-avatar" />
            ))}
            <div className="lt-avatar lt-avatar-count">+2k</div>
          </div>

          <p className="lt-avatars-label">
            Lugares maravillosos
          </p>
        </div>

        <div className="lt-testimonials-right">
          <div className="lt-testimonial-card">
            <span className="material-symbols-outlined lt-quote-icon">
              travel
            </span>

            <p className="lt-quote-text">
              Diseñamos cada viaje de forma personalizada, seleccionando los
              mejores vuelos, hospedajes y experiencias para que solo tengas que
              disfrutar. Nuestro compromiso es convertir cada destino en un
              recuerdo inolvidable.
            </p>

            <div className="lt-quote-attribution">
              <div className="lt-quote-line" />
              <div>
                <p className="lt-quote-name">Experiencias a tu medida</p>
                <p className="lt-quote-role">
                  Planeación • Reservaciones • Asesoría personalizada
                </p>
              </div>
            </div>
          </div>

          <div className="lt-testimonial-float">
            <div className="lt-stars">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className="material-symbols-outlined lt-star"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              ))}
            </div>

            <p className="lt-float-text">
              Atención personalizada, pagos seguros y acompañamiento antes,
              durante y después de tu viaje.
            </p>

            <p className="lt-float-author">
              Tu tranquilidad es nuestra prioridad
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
