import DestinationCard from "../components/publicas/DestinationCard.tsx";
import { destinations } from "../data/destinations";
import { row2Left } from "../data/destinations";
import { smallDestinations } from "../data/destinations";

export default function DestinationsSection() {
  return (
    <section className="lt-section lt-destinations">
      <div className="lt-section-header">
        <div>
          <h2 className="lt-eyebrow lt-coral">Colección Elite</h2>
          <h3 className="lt-headline-primary">Explora lo Extraordinario</h3>
        </div>
        <p className="lt-destinations-sub">
          Selecciones exclusivas de los destinos más codiciados de México y el mundo.
        </p>
      </div>
      <div className="lt-bento">
        <div className="lt-bento-row">
          <DestinationCard {...destinations[0]} large />
          <DestinationCard {...destinations[1]} />
        </div>
        <div className="lt-bento-row">
          <DestinationCard {...row2Left} />
          <div className="lt-bento-small">
            {smallDestinations.map((d) => (
              <DestinationCard key={d.id} {...d} small />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}