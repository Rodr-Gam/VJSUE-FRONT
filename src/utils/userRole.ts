export type AppRole = "admin" | "cliente";

function normalizeRoleValue(value: unknown): AppRole | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "admin" || normalized === "administrador") return "admin";
  if (normalized === "cliente" || normalized === "client") return "cliente";

  return null;
}

export function getUserRole(user: unknown): AppRole | null {
  if (!user || typeof user !== "object") return null;

  const record = user as Record<string, unknown>;

  const fromRole = normalizeRoleValue(record.role);
  if (fromRole) return fromRole;

  if (record.role && typeof record.role === "object") {
    const roleObj = record.role as Record<string, unknown>;
    const fromNested =
      normalizeRoleValue(roleObj.name) ??
      normalizeRoleValue(roleObj.slug) ??
      normalizeRoleValue(roleObj.role);
    if (fromNested) return fromNested;
  }

  const roleId = record.role_id;
  if (roleId === 1 || roleId === "1") return "admin";
  if (roleId === 2 || roleId === "2") return "cliente";

  return null;
}
