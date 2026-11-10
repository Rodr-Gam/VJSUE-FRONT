import { useState } from "react";
import { packageService } from "../../packageService";
import { parsePackageApiError, validatePackageImageFile } from "../../utils/packageImages";
import { PACKAGE_IMAGE_ACCEPT } from "../../types/package";

interface CarruselUploaderProps {
  packageId: number;
  onUploadSuccess?: () => void;
}

/** @deprecated Usar PackageGalleryManager en su lugar. */
export default function CarruselUploader({
  packageId,
  onUploadSuccess,
}: CarruselUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage("Por favor, selecciona una imagen primero.");
      return;
    }

    const validation = validatePackageImageFile(selectedFile);
    if (validation) {
      setMessage(validation);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await packageService.uploadPackageImage(
        packageId,
        selectedFile,
        imageName,
      );
      setMessage("¡Imagen agregada al carrusel con éxito!");
      setSelectedFile(null);
      setImageName("");
      onUploadSuccess?.();
    } catch (error) {
      setMessage(parsePackageApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-slate-800 text-white rounded-lg shadow-md max-w-md my-4">
      <h3 className="text-lg font-bold mb-3">Agregar foto al carrusel</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Nombre de la imagen (opcional):</label>
          <input
            type="text"
            className="w-full p-2 rounded bg-slate-700 border border-slate-600"
            value={imageName}
            onChange={(e) => setImageName(e.target.value)}
            placeholder="Ej: Vista de la piscina"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Selecciona el archivo:</label>
          <input
            type="file"
            accept={PACKAGE_IMAGE_ACCEPT}
            className="w-full text-sm text-slate-400"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-2 rounded disabled:bg-slate-600 transition"
        >
          {loading ? "Subiendo..." : "Subir al carrusel"}
        </button>
      </form>
      {message && (
        <p className="mt-3 text-sm text-center text-yellow-400">{message}</p>
      )}
    </div>
  );
}
