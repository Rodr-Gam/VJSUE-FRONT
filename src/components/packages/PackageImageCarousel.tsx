import "../../styles/PackageCarousel.css";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ImageIcon } from "lucide-react";
import { PACKAGE_PLACEHOLDER, type TravelPackage } from "../../types/package";
import { buildCarouselSlides } from "../../utils/packageImages";

interface PackageImageCarouselProps {
  pkg: Pick<TravelPackage, "name" | "image_path" | "images">;
  className?: string;
}

export default function PackageImageCarousel({
  pkg,
  className = "",
}: PackageImageCarouselProps) {
  const slides = buildCarouselSlides(pkg);
  const [index, setIndex] = useState(0);

  if (slides.length === 0) {
    return (
      <div className={`pkg-carousel pkg-carousel--placeholder ${className}`}>
        <img src={PACKAGE_PLACEHOLDER} alt={pkg.name} />
        <div className="pkg-carousel-placeholder-label">
          <ImageIcon size={28} />
          <span>Sin imágenes disponibles</span>
        </div>
      </div>
    );
  }

  const go = (dir: -1 | 1) => {
    setIndex((prev) => (prev + dir + slides.length) % slides.length);
  };

  return (
    <div className={`pkg-carousel ${className}`}>
      <img
        src={slides[index].src}
        alt={slides[index].alt}
        className="pkg-carousel-img"
      />

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="pkg-carousel-btn pkg-carousel-btn--prev"
            onClick={() => go(-1)}
            aria-label="Imagen anterior"
          >
            <ChevronLeftIcon size={22} />
          </button>
          <button
            type="button"
            className="pkg-carousel-btn pkg-carousel-btn--next"
            onClick={() => go(1)}
            aria-label="Imagen siguiente"
          >
            <ChevronRightIcon size={22} />
          </button>
          <div className="pkg-carousel-dots">
            {slides.map((slide, i) => (
              <button
                key={slide.key}
                type="button"
                className={`pkg-carousel-dot${i === index ? " pkg-carousel-dot--active" : ""}`}
                onClick={() => setIndex(i)}
                aria-label={`Ver imagen ${i + 1}`}
              />
            ))}
          </div>
          <span className="pkg-carousel-counter">
            {index + 1} / {slides.length}
          </span>
        </>
      )}
    </div>
  );
}
