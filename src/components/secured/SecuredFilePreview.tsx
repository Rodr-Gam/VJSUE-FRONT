import { useEffect, useState } from "react";
import { fetchSecuredFileBlob } from "../../utils/securedFiles";
import { isPdfFile } from "../../utils/storageUrl";

interface SecuredFilePreviewProps {
  fileRef: string;
  originalName: string;
  iframeClassName?: string;
  imageClassName?: string;
}

export default function SecuredFilePreview({
  fileRef,
  originalName,
  iframeClassName = "",
  imageClassName = "",
}: SecuredFilePreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    setBlobUrl(null);
    setError(null);

    fetchSecuredFileBlob(fileRef)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudo cargar la vista previa.");
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileRef]);

  if (error) {
    return <p className="adm-cell-muted text-sm">{error}</p>;
  }

  if (!blobUrl) {
    return <p className="adm-cell-muted text-sm">Cargando vista previa…</p>;
  }

  const displayUrl = blobUrl;

  if (isPdfFile(fileRef, originalName)) {
    return (
      <iframe
        title={originalName}
        src={displayUrl}
        className={iframeClassName}
      />
    );
  }

  return (
    <img
      src={displayUrl}
      alt={originalName}
      className={imageClassName}
    />
  );
}
