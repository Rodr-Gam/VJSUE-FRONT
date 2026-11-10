export interface PackageImage {
  id: number;
  package_id: number;
  image_name?: string;
  url: string;
  created_at?: string;
  updated_at?: string;
}

export interface PackageCity {
  id: number;
  name: string;
  country?: string;
}

export interface TravelPackage {
  id: number;
  name: string;
  description?: string;
  city_id: number;
  duration: string;
  departure_date: string;
  return_date: string;
  stock: number;
  quota_adults?: number | null;
  quota_juniors?: number | null;
  quota_children?: number | null;
  price_adult: number | string;
  price_junior: number | string;
  price_child: number | string;
  package_total_cost?: number | string | null;
  platform_profit_percent?: number | null;
  provider_cost?: number | string | null;
  client_cost?: number | string | null;
  supplier_payment?: number | string | null;
  bonus_discount?: number | string | null;
  bonus_discount_note?: string | null;
  image_path?: string | null;
  image_url?: string | null;
  status: string;
  city?: PackageCity;
  images?: PackageImage[];
  reserved_seats_total?: number;
}

export const PACKAGE_IMAGE_ACCEPT = "image/jpeg,image/png,image/jpg,image/webp";
export const PACKAGE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export const PACKAGE_PLACEHOLDER =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop";
