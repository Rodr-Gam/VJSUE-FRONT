import {
  PACKAGE_IMAGE_MAX_BYTES,
  PACKAGE_PLACEHOLDER,
  type PackageImage,
  type TravelPackage,
} from "../types/package";

export function getStorageBaseUrl(): string {
  const apiUrl =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
  return apiUrl.replace(/\/api\/?$/, "");
}

/** URL completa de la imagen principal a partir de image_path relativo. */
export function getMainImageUrl(imagePath?: string | null): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `${getStorageBaseUrl()}/storage/${imagePath}`;
}

/** Imagen para tarjetas: portada → primera del carrusel → placeholder. */
export function getPackageCardImageUrl(pkg: Pick<
  TravelPackage,
  "image_path" | "images"
>): string {
  const main = getMainImageUrl(pkg.image_path);
  if (main) return main;
  if (pkg.images?.length) return pkg.images[0].url;
  return PACKAGE_PLACEHOLDER;
}

export interface CarouselSlide {
  key: string;
  src: string;
  alt: string;
  isMain: boolean;
}

/** Slides del carrusel público: portada primero, luego images[].url */
export function buildCarouselSlides(
  pkg: Pick<TravelPackage, "name" | "image_path" | "images">,
): CarouselSlide[] {
  const slides: CarouselSlide[] = [];
  const main = getMainImageUrl(pkg.image_path);

  if (main) {
    slides.push({
      key: "main",
      src: main,
      alt: `${pkg.name} — imagen principal`,
      isMain: true,
    });
  }

  (pkg.images ?? []).forEach((img: PackageImage) => {
    if (!img.url) return;
    slides.push({
      key: `carousel-${img.id}`,
      src: img.url,
      alt: img.image_name || pkg.name,
      isMain: false,
    });
  });

  return slides;
}

export function validatePackageImageFile(file: File): string | null {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (!allowed.includes(file.type)) {
    return "Formato no válido. Usa JPEG, PNG, JPG o WEBP.";
  }
  if (file.size > PACKAGE_IMAGE_MAX_BYTES) {
    return "La imagen no debe superar 2 MB.";
  }
  return null;
}

interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

export function parsePackageApiError(error: unknown): string {
  const err = error as {
    response?: { status?: number; data?: ApiErrorBody };
  };
  const status = err.response?.status;
  const data = err.response?.data;

  if (status === 403) return data?.message || "No autorizado.";
  if (status === 404) return data?.message || "Recurso no encontrado.";
  if (status === 422) {
    if (data?.errors) {
      return Object.values(data.errors).flat().join(", ");
    }
    return data?.message || "Error de validación.";
  }

  return data?.message || "Ocurrió un error inesperado.";
}
