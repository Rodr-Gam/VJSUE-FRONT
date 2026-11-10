import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./AdminLayout.css";
import {
  Package,
  Users,
  SquarePen,
  Building2,
  BookOpenText,
  IdCardLanyard,
  Plane,
  Hotel,
  Bus,
  LogOut,
  ChevronDown,
  ChevronUp,
  Globe,
  UserRound,
  Wallet,
  TrendingUp,
  Banknote,
  ArrowLeftRight,
  CalendarHeart,
  Route,
  Archive,
} from "lucide-react";
import Logo from "../assets/LogoViajes512x512.png";
import AdminNotificationsBell from "../components/Admin/AdminNotificationsBell";

// ─────────────────────────────────────────────
//  TIPOS
// ─────────────────────────────────────────────
interface AdminLayoutProps {
  children: ReactNode;
}

// ─────────────────────────────────────────────
//  DEFINICIÓN DEL MENÚ
// ─────────────────────────────────────────────
const NAV_ITEMS = [
  {
    section: "General",
    links: [
      { label: "Sitio público", icon: Globe, href: "/" },
      { label: "Mi perfil", icon: UserRound, href: "/perfil" },
    ],
  },
  {
    section: "Catálogo",
    links: [
      {
        label: "Paquetes",
        icon: Package,
        children: [
          {
            label: "Crear paquete",
            icon: SquarePen,
            href: "/admin/crear-paquete",
          },
          { label: "Ver paquetes", href: "/admin/paquetes" },
        ],
      },
      {
        label: "Destinos",
        icon: Building2,
        children: [
          { label: "Crear Ciudad", href: "/admin/crear-ciudad" },
          { label: "Ver Ciudades", href: "/admin/ciudades" },
        ],
      },
    ],
  },
  {
    section: "Reservaciones",
    links: [
      {
        label: "Reservas",
        icon: BookOpenText,
        children: [
          { label: "Reserva privada (rápida)", href: "/admin/reservas/rapida" }, //crear reserva rapida
          { label: "Reservar paquete existente", href: "/admin/crear-reserva" },
          { label: "Ver reservas", href: "/admin/ver-reserva" },
          { label: "Archivadas", href: "/admin/reservas/archivados" },
        ],
      },
      {
        label: "Tours",
        icon: Route,
        children: [
          { label: "Crear Tour", href: "/admin/reservas/tours" },
          { label: "Ver Tours", href: "/admin/reservas/tours/listado" },
        ],
      },
      {
        label: "Pasajeros",
        icon: IdCardLanyard,
        children: [
          { label: "Crear pasajero", href: "/admin/crear-pasajero" },
          { label: "Ver listas", href: "/admin/ver-pasajeros" },
        ],
      },
    ],
  },
  {
    section: "Operación de viajes",
    links: [
      {
        label: "Vuelos",
        icon: Plane,
        children: [
          { label: "Crear vuelo", href: "/admin/crear-vuelo" },
          { label: "Ver vuelo", href: "/admin/ver-vuelo" },
        ],
      },
      {
        label: "Hoteles",
        icon: Hotel,
        children: [
          { label: "Crear hotel", href: "/admin/crear-hotel" },
          { label: "Ver hoteles", href: "/admin/ver-hotel" },
        ],
      },
      {
        label: "Transporte",
        icon: Bus,
        children: [
          { label: "Crear transporte", href: "/admin/crear-transporte" },
          { label: "Ver transportes", href: "/admin/ver-transporte" },
        ],
      },
    ],
  },
  {
    section: "Finanzas",
    links: [
      {
        label: "Registrar abonos",
        icon: Wallet,
        href: "/admin/cuentas",
      },
      {
        label: "Ganancias",
        icon: TrendingUp,
        href: "/admin/ganancias",
      },
      {
        label: "Pagos a proveedor",
        icon: Banknote,
        href: "/admin/pagos-proveedor",
      },
      {
        label: "Abonos de clientes",
        icon: ArrowLeftRight,
        href: "/admin/transferencias",
      },
      {
        label: "Archivados",
        icon: Archive,
        href: "/admin/finanzas/archivados",
      },
      {
        label: "Fechas importantes",
        icon: CalendarHeart,
        href: "/admin/fechas-importantes",
      },
    ],
  },
  {
    section: "Usuarios",
    links: [
      {
        label: "Clientes",
        icon: Users,
        children: [
          { label: "Ver clientes", href: "/admin/clientes" },
          { label: "Crear cliente", href: "/admin/crear-cliente" },
        ],
      },
    ],
  },
];

function getInitials(name?: string): string {
  if (!name?.trim()) return "VS";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

// ─────────────────────────────────────────────
//  COMPONENTE
// ─────────────────────────────────────────────
export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [canScrollNavDown, setCanScrollNavDown] = useState(false);
  const [canScrollNavUp, setCanScrollNavUp] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const { user, logout } = useAuth();

  const updateNavScrollState = useCallback(() => {
    const nav = navRef.current;
    if (!nav) {
      setCanScrollNavDown(false);
      setCanScrollNavUp(false);
      return;
    }

    const hasOverflow = nav.scrollHeight > nav.clientHeight + 4;
    const notAtBottom = nav.scrollTop + nav.clientHeight < nav.scrollHeight - 4;
    const notAtTop = nav.scrollTop > 4;

    setCanScrollNavDown(hasOverflow && notAtBottom);
    setCanScrollNavUp(hasOverflow && notAtTop);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    updateNavScrollState();
    window.addEventListener("resize", updateNavScrollState);

    return () => window.removeEventListener("resize", updateNavScrollState);
  }, [updateNavScrollState, openMenus]);

  const scrollNavDown = () => {
    navRef.current?.scrollBy({ top: 140, behavior: "smooth" });
  };

  const scrollNavUp = () => {
    navRef.current?.scrollBy({ top: -140, behavior: "smooth" });
  };

  const toggleMenu = (menuLabel: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuLabel]: !prev[menuLabel],
    }));
  };

  return (
    <div>
      {/* Fondo global compartido */}
      <div className="al-bg">
        <div className="al-bg-orb al-bg-orb--1" />
        <div className="al-bg-orb al-bg-orb--2" />
        <div className="al-grid" />
      </div>

      <div className="al-layout">
        {/* Botón hamburguesa - solo móvil */}
        <button
          className={`al-hamburger ${sidebarOpen ? "al-hamburger--hidden" : ""}`}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>

        {/* Overlay */}
        {sidebarOpen && (
          <div className="al-overlay" onClick={() => setSidebarOpen(false)} />
        )}
        {/* ── SIDEBAR ── */}
        <aside
          className={`al-sidebar ${sidebarOpen ? "al-sidebar--open" : ""}`}
        >
          {/* Logo / Brand */}
          <div className="al-brand-block">
            <div className="al-brand">
              <img src={Logo} alt="LuxeTravel Logo" className="al-logo" />
              <div>
                <p className="text-center uppercase font-bold text-2xl al-brand-name">
                  Viajes Sueña
                </p>
                <p className="al-brand-role">Panel Admin</p>
              </div>
            </div>

            {(canScrollNavUp || canScrollNavDown) && (
              <div className="al-brand-scroll-controls">
                {canScrollNavUp && (
                  <button
                    type="button"
                    className="al-brand-scroll al-brand-scroll--up"
                    onClick={scrollNavUp}
                    aria-label="Subir en el menú"
                    title="Subir en el menú"
                  >
                    <ChevronUp size={18} aria-hidden="true" />
                  </button>
                )}
                {canScrollNavDown && (
                  <button
                    type="button"
                    className="al-brand-scroll al-brand-scroll--down"
                    onClick={scrollNavDown}
                    aria-label="Bajar en el menú"
                    title="Bajar en el menú"
                  >
                    <ChevronDown size={18} aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Navegación dinámica */}
          <nav ref={navRef} className="al-nav" onScroll={updateNavScrollState}>
            {NAV_ITEMS.map((group) => (
              <div key={group.section}>
                <p className="al-nav-section">{group.section}</p>

                {group.links.map((link) => {
                  const hasChildren = "children" in link;

                  if (hasChildren) {
                    const Icon = link.icon;

                    return (
                      <div key={link.label}>
                        <button
                          className="al-nav-item"
                          onClick={() => toggleMenu(link.label)}
                        >
                          {Icon && (
                            <span className="al-nav-icon">
                              {typeof Icon === "string" ? (
                                Icon
                              ) : (
                                <Icon size={18} />
                              )}
                            </span>
                          )}

                          {link.label}

                          <span className="al-nav-arrow">
                            {openMenus[link.label] ? "▼" : "▶"}
                          </span>
                        </button>

                        {openMenus[link.label] && (
                          <div className="al-submenu">
                            {link.children.map((child) => (
                              <NavLink
                                key={child.label}
                                to={child.href}
                                className={({ isActive }) =>
                                  `al-nav-subitem${isActive ? " al-nav-subitem--active" : ""}`
                                }
                                onClick={() => setSidebarOpen(false)}
                              >
                                {child.label}
                              </NavLink>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.href}
                      to={link.href!}
                      className={({ isActive }) =>
                        `al-nav-item ${isActive ? "al-nav-item--active" : ""}`
                      }
                      onClick={() => setSidebarOpen(false)}
                    >
                      {Icon && (
                        <span className="al-nav-icon">
                          <Icon size={18} />
                        </span>
                      )}

                      {link.label}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer del sidebar */}
          <div className="al-sidebar-footer">
            <Link to="/perfil" onClick={() => setSidebarOpen(false)}>
              <div className="al-avatar">{getInitials(user?.name)}</div>
            </Link>
            <div className="min-w-0 flex-1">
              <p className="al-avatar-name truncate">
                {user?.name ?? "Administrador"}
              </p>
              <p className="al-avatar-role">Super Admin</p>
            </div>

            {/* 👇 Agrega este botón */}
            <button
              onClick={logout}
              className="al-logout-btn"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* ── CONTENIDO DE CADA PÁGINA ── */}
        <main className="al-content">
          <div className="al-topbar">
            <AdminNotificationsBell />
          </div>
          <div className="al-content-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
