import { useRef, useState } from "react";
import { DeleteIcon, ImagesIcon, UploadIcon } from "lucide-react";
import { packageService } from "../../packageService";
import {
  parsePackageApiError,
  validatePackageImageFile,
} from "../../utils/packageImages";
import { PACKAGE_IMAGE_ACCEPT } from "../../types/package";
import type { PackageImage } from "../../types/package";

interface PackageGalleryManagerProps {
  packageId: number;
  images: PackageImage[];
  onImagesUpdated: (images: PackageImage[]) => void;
}

export default function PackageGalleryManager({
  packageId,
  images,
  onImagesUpdated,
}: PackageGalleryManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageName, setImageName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "success" | "error" | "info";
  } | null>(null);

  const refreshImages = async () => {
    const pkg = await packageService.getPackageById(packageId);
    onImagesUpdated(pkg.images ?? []);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;

    setUploading(true);
    setMensaje(null);
    let uploaded = 0;
    const errors: string[] = [];

    for (const file of list) {
      const validation = validatePackageImageFile(file);
      if (validation) {
        errors.push(`${file.name}: ${validation}`);
        continue;
      }

      try {
        const label = list.length === 1 ? imageName : file.name;
        await packageService.uploadPackageImage(packageId, file, label);
        uploaded += 1;
      } catch (error) {
        errors.push(`${file.name}: ${parsePackageApiError(error)}`);
      }
    }

    if (uploaded > 0) {
      await refreshImages();
      setImageName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMensaje({
        texto:
          uploaded === 1
            ? "Imagen agregada al carrusel."
            : `${uploaded} imágenes agregadas al carrusel.`,
        tipo: "success",
      });
    }

    if (errors.length) {
      setMensaje({
        texto: errors.join(" "),
        tipo: uploaded > 0 ? "info" : "error",
      });
    }

    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) uploadFiles(files);
  };

  const handleDelete = async (imageId: number) => {
    if (!window.confirm("¿Eliminar esta imagen del carrusel?")) return;

    setDeletingId(imageId);
    setMensaje(null);

    try {
      await packageService.deletePackageImage(imageId);
      await refreshImages();
      setMensaje({ texto: "Imagen eliminada del carrusel.", tipo: "success" });
    } catch (error) {
      setMensaje({ texto: parsePackageApiError(error), tipo: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="R-card-f mt-4">
      <div className="flex items-center gap-2 mb-4 px-4 pt-4">
        <ImagesIcon size={24} className="text-[#d3a762]" />
        <div>
          <h3 className="text-lg font-bold text-black">Galería / Carrusel</h3>
          <p className="text-sm text-gray-500">
            Sube imágenes adicionales (máx. 2 MB, JPEG/PNG/WEBP). Se envían una
            por una al servidor.
          </p>
        </div>
      </div>

      <div className="px-4 pb-4">
        {mensaje && (
          <div className={`cc-alert cc-alert--${mensaje.tipo}`}>
            <span className="cc-alert-icon">
              {mensaje.tipo === "success" ? "✓" : "!"}
            </span>
            <span>{mensaje.texto}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative border border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              <img
                src={img.url}
                alt={img.image_name || "Imagen del carrusel"}
                className="w-full h-24 object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                disabled={deletingId === img.id || uploading}
                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow disabled:opacity-50"
                title="Eliminar"
              >
                <DeleteIcon size={14} className="text-red-500" />
              </button>
              <p className="text-xs text-center py-1 truncate px-1 text-gray-600">
                {img.image_name || "Sin nombre"}
              </p>
            </div>
          ))}
          {images.length === 0 && !uploading && (
            <p className="text-gray-400 text-sm col-span-full py-2">
              Aún no hay imágenes en el carrusel. Sube la primera abajo.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="R-label">
            Nombre / etiqueta (opcional)
            <input
              type="text"
              className="R-input"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              placeholder="Ej. Vista al mar"
              disabled={uploading}
            />
          </label>

          <label className="R-label lg:col-span-2">
            Seleccionar imagen(es)
            <input
              ref={fileInputRef}
              type="file"
              accept={PACKAGE_IMAGE_ACCEPT}
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <span className="text-sm text-gray-500 mt-1 block">
              Puedes elegir varios archivos; se suben uno por uno.
            </span>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              className="R-button-f flex items-center gap-2 h-18 justify-center w-full"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon size={18} />
              {uploading ? "Subiendo..." : "Elegir archivos"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
