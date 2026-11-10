import { api } from "../api";

export type AdminNotificationKind =
  | "receipt_pending"
  | "account_overdue"
  | "reservation_pending"
  | "missing_flight"
  | "missing_transport";

export interface AdminNotification {
  id: string;
  text: string;
  time: string;
  href: string;
  kind: AdminNotificationKind;
  priority: number;
}

const READ_STORAGE_KEY = "viajes-suena-admin-notif-read";
const CACHE_STORAGE_KEY = "viajes-suena-admin-notif-cache";
const CACHE_TS_KEY = "viajes-suena-admin-notif-cache-ts";
export const ADMIN_NOTIF_CACHE_MS = 5 * 60 * 1000;

export async function fetchAdminNotifications(
  force = false,
): Promise<AdminNotification[]> {
  if (!force) {
    const cached = readCachedNotifications();
    if (cached) return cached;
  }

  const { data } = await api.get<{ notifications?: AdminNotification[] }>(
    "/admin/notifications",
  );

  const items = Array.isArray(data.notifications) ? data.notifications : [];
  writeCachedNotifications(items);
  return items;
}

export function readCachedNotifications(): AdminNotification[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_STORAGE_KEY);
    const ts = Number(sessionStorage.getItem(CACHE_TS_KEY) || 0);
    if (!raw || !ts || Date.now() - ts > ADMIN_NOTIF_CACHE_MS) return null;
    const parsed = JSON.parse(raw) as AdminNotification[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedNotifications(items: AdminNotification[]): void {
  sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(items));
  sessionStorage.setItem(CACHE_TS_KEY, String(Date.now()));
}

export function loadAdminReadNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function saveAdminReadNotificationIds(ids: Set<string>): void {
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]));
}

export function applyAdminReadState(
  notifications: AdminNotification[],
  readIds: Set<string>,
): Array<AdminNotification & { read: boolean }> {
  return notifications.map((n) => ({
    ...n,
    read: readIds.has(n.id),
  }));
}

export function pruneAdminReadIds(
  readIds: Set<string>,
  activeIds: string[],
): Set<string> {
  const active = new Set(activeIds);
  return new Set([...readIds].filter((id) => active.has(id)));
}
