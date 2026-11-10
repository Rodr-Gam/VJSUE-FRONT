const SECURED_FILE_PATTERN =
  /^(https?:\/\/[^/]+)?\/?(api\/)?(payment-receipts|reservation-documents)\/\d+\/file\/?$/;

/** Ruta servida por la API con Bearer (no /storage público). */
export function isSecuredApiFileRef(url?: string | null): boolean {
  if (!url) return false;
  return SECURED_FILE_PATTERN.test(url.trim());
}

export function isLegacyPublicStorageUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.includes("/storage/") || url.startsWith("storage/");
}

/** Path relativo para axios (ej. payment-receipts/5/file). */
export function normalizeSecuredApiPath(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const parsed = new URL(trimmed);
    return parsed.pathname.replace(/^\/api\/?/, "").replace(/^\//, "");
  }
  return trimmed.replace(/^\/api\/?/, "").replace(/^\//, "");
}

export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(
    /\/$/,
    "",
  );
}

/** Base URL del servidor Laravel (sin /api). */
export function getStorageBaseUrl(): string {
  const apiUrl =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
  return apiUrl.replace(/\/api\/?$/, "");
}

/**
 * Convierte la URL que devuelve la API (a veces relativa o con APP_URL incorrecto)
 * en una URL absoluta servida por Laravel (/storage/...).
 */
export function resolveStorageUrl(url?: string | null): string {
  if (!url) return "";

  if (isSecuredApiFileRef(url)) {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${getApiBaseUrl()}/${normalizeSecuredApiPath(url)}`;
  }

  const base = getStorageBaseUrl();

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const parsed = new URL(url);
      const isLocalMisconfig =
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" && parsed.port === "";

      if (isLocalMisconfig || parsed.origin !== new URL(base).origin) {
        return `${base}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      return url;
    }
    return url;
  }

  if (url.startsWith("/storage/")) {
    return `${base}${url}`;
  }

  if (url.startsWith("storage/")) {
    return `${base}/${url}`;
  }

  return `${base}/storage/${url.replace(/^\/+/, "")}`;
}

export function isPdfFile(url: string, fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith(".pdf") || url.toLowerCase().includes(".pdf");
}
