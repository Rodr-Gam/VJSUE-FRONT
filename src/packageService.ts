import { api } from "./api";
import type { PackageImage, TravelPackage } from "./types/package";

function unwrapPackages(data: unknown): TravelPackage[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.packages)) return record.packages as TravelPackage[];
    if (Array.isArray(record.data)) return record.data as TravelPackage[];
  }
  return [];
}

function unwrapPackage(data: unknown): TravelPackage {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (record.package && typeof record.package === "object") {
      return record.package as TravelPackage;
    }
  }
  return data as TravelPackage;
}

export const packageService = {
  getCities: async () => {
    const response = await api.get("/cities");
    return response.data;
  },

  createCity: async (cityData: { name: string; country: string }) => {
    const response = await api.post("/cities", {
      name: cityData.name.trim(),
      country: (cityData.country.trim() || "México"),
    });
    return response.data;
  },

  getPublicPackages: async (): Promise<TravelPackage[]> => {
    const response = await api.get("/packages/public");
    return unwrapPackages(response.data);
  },

  getPublicPackageById: async (id: number): Promise<TravelPackage | null> => {
    const packages = await packageService.getPublicPackages();
    return packages.find((p) => p.id === id) ?? null;
  },

  getPackages: async () => {
    const response = await api.get("/packages");
    return response.data;
  },

  getPackageById: async (id: number): Promise<TravelPackage> => {
    const response = await api.get(`/packages/${id}`);
    return unwrapPackage(response.data);
  },

  createPackage: async (formData: FormData) => {
    const response = await api.post("/packages", formData);
    return response.data as { message?: string; package: TravelPackage };
  },

  updatePackage: async (id: number, formData: FormData) => {
    const response = await api.post(`/packages/${id}`, formData);
    return response.data;
  },

  deletePackage: async (id: number) => {
    const response = await api.delete(`/packages/${id}`);
    return response.data;
  },

  uploadPackageImage: async (
    packageId: number,
    file: File,
    imageName?: string,
  ): Promise<{ message?: string; image: PackageImage }> => {
    const formData = new FormData();
    formData.append("package_id", String(packageId));
    formData.append("image", file);
    if (imageName?.trim()) {
      formData.append("image_name", imageName.trim());
    }
    const response = await api.post("/package-images", formData);
    return response.data;
  },

  deletePackageImage: async (imageId: number) => {
    const response = await api.delete(`/package-images/${imageId}`);
    return response.data;
  },
};
