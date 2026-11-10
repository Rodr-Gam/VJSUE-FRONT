import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../../styles/landingCliente/landing.css";
import Navbar from "../../components/publicas/navCliente";
import Hero from "../../components/publicas/hero";
import Footer from "../../components/publicas/footerCliente";
import WhatsAppFAB from "../../components/publicas/WhatsApp";
import TestimonialsSection from "../../sections/testimonial";
import ContactSection from "../../sections/contact";
import ServicesSection from "../../sections/services";

// --- Hooks ---
function useScrolled(threshold: number) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

function useSectionFadeIn() {
  useEffect(() => {
    const sections = document.querySelectorAll(".lt-section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("lt-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);
}

function useScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const id = location.hash.replace("#", "");
    const scrollToTarget = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    requestAnimationFrame(() => {
      setTimeout(scrollToTarget, 120);
    });
  }, [location.hash]);
}

// --- Main ---
export default function LuxeTravel() {
  const scrolled = useScrolled(100);
  useSectionFadeIn();
  useScrollToHash();

  return (
    <div className="lt-root">
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <Navbar scrolled={scrolled} />
      <Hero />
      <ServicesSection />
      <TestimonialsSection />
      <ContactSection />
      <WhatsAppFAB />
      <Footer />
    </div>
  );
}
