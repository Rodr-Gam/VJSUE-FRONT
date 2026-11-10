import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  applyAdminReadState,
  fetchAdminNotifications,
  loadAdminReadNotificationIds,
  pruneAdminReadIds,
  readCachedNotifications,
  saveAdminReadNotificationIds,
  type AdminNotification,
} from "../../utils/adminNotifications";

type NotificationItem = AdminNotification & { read: boolean };

export default function AdminNotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const readIdsRef = useRef(loadAdminReadNotificationIds());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const syncNotifications = useCallback((items: AdminNotification[]) => {
    const activeIds = items.map((n) => n.id);
    readIdsRef.current = pruneAdminReadIds(readIdsRef.current, activeIds);
    saveAdminReadNotificationIds(readIdsRef.current);
    setNotifications(applyAdminReadState(items, readIdsRef.current));
  }, []);

  const refreshNotifications = useCallback(
    async (force = false) => {
      setLoading(true);
      try {
        const items = await fetchAdminNotifications(force);
        syncNotifications(items);
      } catch (err) {
        console.error("Error al cargar notificaciones admin:", err);
        if (!readCachedNotifications()) syncNotifications([]);
      } finally {
        setLoading(false);
      }
    },
    [syncNotifications],
  );

  useEffect(() => {
    const cached = readCachedNotifications();
    if (cached) {
      syncNotifications(cached);
    }
  }, [syncNotifications]);

  useEffect(() => {
    if (!open) return;

    const cached = readCachedNotifications();
    if (cached) {
      syncNotifications(cached);
    }

    void refreshNotifications(!cached);
  }, [open, refreshNotifications, syncNotifications]);

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

  function markAllRead() {
    readIdsRef.current = new Set(notifications.map((n) => n.id));
    saveAdminReadNotificationIds(readIdsRef.current);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    readIdsRef.current.add(id);
    saveAdminReadNotificationIds(readIdsRef.current);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function handleNotificationClick(notification: NotificationItem) {
    markRead(notification.id);
    setOpen(false);
    navigate(notification.href);
  }

  function handleToggleOpen() {
    setOpen((value) => !value);
  }

  return (
    <div className="al-notif-wrap">
      <button
        ref={bellRef}
        type="button"
        className="al-notif-btn"
        onClick={handleToggleOpen}
        aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}`}
        aria-expanded={open}
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="al-notif-badge">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div ref={dropdownRef} className="al-notif-dropdown">
          <div className="al-notif-header">
            <span>Notificaciones</span>
            <div className="al-notif-header-actions">
              <button
                type="button"
                className="al-notif-refresh"
                onClick={() => void refreshNotifications(true)}
                disabled={loading}
              >
                {loading ? "Actualizando..." : "Actualizar"}
              </button>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead}>
                  Marcar leídas
                </button>
              )}
            </div>
          </div>

          {loading && notifications.length === 0 ? (
            <p className="al-notif-empty">Cargando avisos...</p>
          ) : notifications.length === 0 ? (
            <p className="al-notif-empty">
              Todo al día. Te avisaremos sobre comprobantes, cuentas vencidas y
              reservas que requieran atención.
            </p>
          ) : (
            <ul className="al-notif-list">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    className={`al-notif-item${notification.read ? " al-notif-item--read" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <span
                      className={`al-notif-dot${notification.read ? " al-notif-dot--read" : ""}`}
                    />
                    <div className="al-notif-content">
                      <p>{notification.text}</p>
                      <p className="al-notif-time">{notification.time}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="al-notif-footer">
            <Link to="/admin/cuentas" onClick={() => setOpen(false)}>
              Ver cuentas
            </Link>
            <Link to="/admin/transferencias" onClick={() => setOpen(false)}>
              Ver transferencias
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
