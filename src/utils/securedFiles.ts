import { api } from "../api";
import {
  isLegacyPublicStorageUrl,
  isSecuredApiFileRef,
  normalizeSecuredApiPath,
  resolveStorageUrl,
} from "./storageUrl";

export async function fetchSecuredFileBlob(fileRef: string): Promise<Blob> {
  if (isLegacyPublicStorageUrl(fileRef)) {
    const res = await fetch(resolveStorageUrl(fileRef), { credentials: "include" });
    if (!res.ok) {
      throw new Error("No se pudo cargar el archivo.");
    }
    return res.blob();
  }

  if (!isSecuredApiFileRef(fileRef)) {
    throw new Error("Referencia de archivo no válida.");
  }

  const path = normalizeSecuredApiPath(fileRef);
  const res = await api.get(path, { responseType: "blob" });
  return res.data as Blob;
}

export async function openSecuredFile(fileRef: string): Promise<void> {
  const blob = await fetchSecuredFileBlob(fileRef);
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
}
