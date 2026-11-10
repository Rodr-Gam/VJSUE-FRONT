import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/LogoViajes512x512.png";
import "../../styles/Cliente.css";
import {
  BellIcon,
  LogOutIcon,
  PackageIcon,
  LayoutDashboardIcon,
  Menu,
  X,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { reservationService } from "../../reservationService";
import {
  applyReadState,
  buildClientNotifications,
  loadReadNotificationIds,
  pruneReadIds,
  saveReadNotificationIds,
  type ClientNotification,
} from "../../utils/clientNotifications";

type NotificationItem = ClientNotification & { read: boolean };

function getInitials(name?: string): string {
  if (!name?.trim()) return "VS";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function NavprivClient() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const readIdsRef = useRef(loadReadNotificationIds());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const syncNotifications = useCallback((items: ClientNotification[]) => {
    const activeIds = items.map((n) => n.id);
    readIdsRef.current = pruneReadIds(readIdsRef.current, activeIds);
    saveReadNotificationIds(readIdsRef.current);
    setNotifications(applyReadState(items, readIdsRef.current));
  }, []);

  useEffect(() => {
    let cancelled = false;

    reservationService
      .getMyReservations()
      .then((reservas) => {
        if (cancelled) return;
        syncNotifications(buildClientNotifications(reservas));
      })
      .catch((err) => {
        console.error("Error al cargar notificaciones:", err);
        if (!cancelled) syncNotifications([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingNotifs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [syncNotifications, location.pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function markAllRead() {
    readIdsRef.current = new Set(notifications.map((n) => n.id));
    saveReadNotificationIds(readIdsRef.current);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    readIdsRef.current.add(id);
    saveReadNotificationIds(readIdsRef.current);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function handleNotificationClick(notification: NotificationItem) {
    markRead(notification.id);
    setOpen(false);
    navigate(notification.href);
  }

  const avatarInitials = useMemo(
    () => getInitials(user?.name),
    [user?.name],
  );

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="npc-header">
        <Link to="/cliente/dashboard" className="npc-brand">
          <div className="npc-logo-wrap">
            <img src={Logo} alt="Logo" />
          </div>
          <span className="npc-brand-text">Viajes sueña</span>
        </Link>

        <nav className="client-nav-links">
          <NavLink
            to="/cliente/dashboard"
            className={({ isActive }) =>
              `client-nav-link${isActive ? " client-nav-link--active" : ""}`
            }
          >
            <LayoutDashboardIcon size={16} />
            Mis reservas
          </NavLink>
          <NavLink
            to="/paquetes-disponibles"
            className={({ isActive }) =>
              `client-nav-link${isActive ? " client-nav-link--active" : ""}`
            }
          >
            <PackageIcon size={16} />
            Ver paquetes
          </NavLink>
          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              `client-nav-link${isActive ? " client-nav-link--active" : ""}`
            }
          >
            <UserRound size={16} />
            Mi perfil
          </NavLink>
        </nav>

        <div className="npc-header-spacer" />

        <div className="npc-actions">
          <div className="npc-notif-wrap">
            <button
              ref={bellRef}
              onClick={() => setOpen((v) => !v)}
              className="npc-icon-btn"
              aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}`}
            >
              <BellIcon size={20} />

              {unreadCount > 0 && (
                <span className="npc-notif-badge">{unreadCount}</span>
              )}
            </button>

            {open && (
              <div ref={dropdownRef} className="npc-notif-dropdown">
                <div className="npc-notif-header">
                  <span>Notificaciones</span>
                  {unreadCount > 0 && (
                    <button type="button" onClick={markAllRead}>
                      Marcar todas como leídas
                    </button>
                  )}
                </div>

                {loadingNotifs ? (
                  <p className="npc-notif-empty">Cargando avisos...</p>
                ) : notifications.length === 0 ? (
                  <p className="npc-notif-empty">
                    No tienes avisos por ahora. Te avisaremos sobre tus viajes y
                    datos pendientes.
                  </p>
                ) : (
                  <ul className="npc-notif-list">
                    {notifications.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          className={`npc-notif-item${n.read ? " npc-notif-item--read" : ""}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <span
                            className={`npc-notif-dot${n.read ? " npc-notif-dot--read" : ""}`}
                          />
                          <div className="npc-notif-content">
                            <p>{n.text}</p>
                            <p className="npc-notif-time">{n.time}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="npc-notif-footer">
                  <Link to="/cliente/dashboard" onClick={() => setOpen(false)}>
                    Ir a mis reservas â†’
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="npc-divider" />

          <Link
            to="/perfil"
            className={`npc-avatar${location.pathname === "/perfil" ? " npc-avatar--active" : ""}`}
            aria-label="Mi perfil"
            title="Mi perfil"
          >
            {avatarInitials}
          </Link>

          <button
            type="button"
            onClick={logout}
            className="al-logout-btn"
            title="Cerrar sesión"
          >
            <LogOutIcon size={22} className="text-[#d3a762]" />
          </button>

          <button
            type="button"
            className="npc-mobile-menu-btn"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <div
        className={`npc-mobile-overlay${menuOpen ? " open" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <nav
        className={`npc-mobile-nav${menuOpen ? " open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <NavLink
          to="/cliente/dashboard"
          className={({ isActive }) =>
            `npc-mobile-nav-link${isActive ? " npc-mobile-nav-link--active" : ""}`
          }
          onClick={closeMenu}
        >
          <LayoutDashboardIcon size={18} />
          Mis reservas
        </NavLink>
        <NavLink
          to="/paquetes-disponibles"
          className={({ isActive }) =>
            `npc-mobile-nav-link${isActive ? " npc-mobile-nav-link--active" : ""}`
          }
          onClick={closeMenu}
        >
          <PackageIcon size={18} />
          Ver paquetes
        </NavLink>
        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            `npc-mobile-nav-link${isActive ? " npc-mobile-nav-link--active" : ""}`
          }
          onClick={closeMenu}
        >
          <UserRound size={18} />
          Mi perfil
        </NavLink>
      </nav>
    </>
  );
}
