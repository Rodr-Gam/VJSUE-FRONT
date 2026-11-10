import "../../styles/landingCliente/header.css";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Menu, X, LayoutDashboard, UserRound } from "lucide-react";
import Logo from "../../assets/LogoViajes512x512.png";
import { useAuth } from "../../hooks/useAuth";

interface HeaderProps {
  scrolled?: boolean;
}

type NavItem =
  | { id: string; label: string; section: string; path?: never }
  | { id: string; label: string; path: string; section?: never };

const NAV_ITEMS: NavItem[] = [
  { id: "inicio", label: "Inicio", section: "inicio" },
  { id: "servicios", label: "Servicios", section: "servicios" },
  { id: "paquetes", label: "Paquetes", path: "/paquetes-disponibles" },
  { id: "nosotros", label: "¿Por qué elegirnos?", section: "nosotros" },
  { id: "contacto", label: "Contacto", section: "contacto" },
];

export default function Header({ scrolled = false }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isCliente, isAdmin, user } = useAuth();
  const [activeSection, setActiveSection] = useState("inicio");
  const [menuOpen, setMenuOpen] = useState(false);
  const isLanding = location.pathname === "/";
  const solidHeader = !isLanding || scrolled;

  const accountLinks = useMemo(() => {
    if (!isAuthenticated) return null;

    if (isCliente) {
      return {
        primary: { to: "/cliente/dashboard", label: "Mis reservas", icon: LayoutDashboard },
        secondary: { to: "/perfil", label: "Mi perfil", icon: UserRound },
      };
    }

    if (isAdmin) {
      return {
        primary: { to: "/admin/paquetes", label: "Panel admin", icon: LayoutDashboard },
        secondary: { to: "/perfil", label: "Mi perfil", icon: UserRound },
      };
    }

    return {
      primary: { to: "/perfil", label: "Mi perfil", icon: UserRound },
      secondary: null,
    };
  }, [isAuthenticated, isCliente, isAdmin]);

  const userInitials = useMemo(() => {
    const name = user?.name?.trim();
    if (!name) return null;
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [user?.name]);

  useEffect(() => {
    if (!isLanding) return;

    const sections = ["inicio", "servicios", "nosotros", "contacto"];

    const handleScroll = () => {
      let current = "inicio";

      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            current = id;
          }
        }
      });

      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLanding]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const isItemActive = useCallback(
    (item: NavItem) => {
      if ("path" in item && item.path) {
        return location.pathname === item.path;
      }
      if ("section" in item && item.section && isLanding) {
        return activeSection === item.section;
      }
      return false;
    },
    [activeSection, isLanding, location.pathname],
  );

  const goToItem = useCallback(
    (item: NavItem) => {
      closeMenu();

      if ("path" in item && item.path) {
        navigate(item.path);
        return;
      }

      if ("section" in item && item.section) {
        if (isLanding) {
          document.getElementById(item.section)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          window.history.replaceState(null, "", `#${item.section}`);
          return;
        }

        navigate({ pathname: "/", hash: `#${item.section}` });
      }
    },
    [isLanding, navigate],
  );

  const renderNavLink = (item: NavItem, className: string) => {
    const href =
      "path" in item
        ? item.path
        : isLanding
          ? `#${item.section}`
          : `/#${item.section}`;

    return (
      <a
        key={item.id}
        href={href}
        className={`${className}${isItemActive(item) ? " active" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          goToItem(item);
        }}
      >
        {item.label}
      </a>
    );
  };

  const PrimaryIcon = accountLinks?.primary.icon;
  const SecondaryIcon = accountLinks?.secondary?.icon;

  return (
    <>
      <header className={`lt-header${solidHeader ? " scrolled" : ""}`}>
        <div className="lt-header-inner">
          <Link to="/" className="lt-logo">
            <img src={Logo} alt="LuxeTravel Logo" className="lt-logo-img" />
          </Link>
          <nav className="lt-nav">
            {NAV_ITEMS.map((item) => renderNavLink(item, "lt-nav-link"))}
          </nav>
          <div className="lt-header-actions">
            {accountLinks && PrimaryIcon ? (
              <div className="lt-account-actions">
                <Link
                  to={accountLinks.primary.to}
                  className={`lt-account-link${
                    location.pathname === accountLinks.primary.to
                      ? " lt-account-link--active"
                      : ""
                  }`}
                >
                  <PrimaryIcon size={16} aria-hidden="true" />
                  {accountLinks.primary.label}
                </Link>
                {accountLinks.secondary && SecondaryIcon && (
                  <Link
                    to={accountLinks.secondary.to}
                    className={`lt-account-link lt-account-link--profile${
                      location.pathname === accountLinks.secondary.to
                        ? " lt-account-link--active"
                        : ""
                    }`}
                  >
                    {userInitials ? (
                      <span className="lt-account-avatar" aria-hidden="true">
                        {userInitials}
                      </span>
                    ) : (
                      <SecondaryIcon size={16} aria-hidden="true" />
                    )}
                    {accountLinks.secondary.label}
                  </Link>
                )}
              </div>
            ) : (
              <Link to="/login">
                <button type="button" className="lt-btn-primary">
                  Iniciar Sesión
                </button>
              </Link>
            )}
            <button
              type="button"
              className="lt-mobile-menu-btn"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`lt-mobile-overlay${menuOpen ? " open" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <nav
        className={`lt-mobile-nav${menuOpen ? " open" : ""}`}
        aria-hidden={!menuOpen}
      >
        {NAV_ITEMS.map((item) => renderNavLink(item, "lt-mobile-nav-link"))}

        {accountLinks && PrimaryIcon && (
          <div className="lt-mobile-account">
            <Link
              to={accountLinks.primary.to}
              className="lt-mobile-nav-link lt-mobile-nav-link--account"
              onClick={closeMenu}
            >
              <PrimaryIcon size={18} aria-hidden="true" />
              {accountLinks.primary.label}
            </Link>
            {accountLinks.secondary && SecondaryIcon && (
              <Link
                to={accountLinks.secondary.to}
                className="lt-mobile-nav-link lt-mobile-nav-link--account"
                onClick={closeMenu}
              >
                <SecondaryIcon size={18} aria-hidden="true" />
                {accountLinks.secondary.label}
              </Link>
            )}
          </div>
        )}

        {!accountLinks && (
          <div className="lt-mobile-nav-cta">
            <Link to="/login" onClick={closeMenu}>
              <button type="button" className="lt-btn-primary lt-btn-lg">
                Iniciar Sesión
              </button>
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}
