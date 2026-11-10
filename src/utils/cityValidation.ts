export interface CityRecord {
  id?: number;
  name: string;
  country?: string | null;
}

export function normalizeCityKey(name: string, country = "México"): string {
  const normalizedName = name.trim().toLowerCase();
  const normalizedCountry = (country.trim() || "México").toLowerCase();
  return `${normalizedName}|${normalizedCountry}`;
}

export function findDuplicateCity(
  cities: CityRecord[],
  name: string,
  country = "México",
): CityRecord | undefined {
  const key = normalizeCityKey(name, country);
  return cities.find((city) => normalizeCityKey(city.name, city.country || "México") === key);
}

export function duplicateCityMessage(name: string, country = "México"): string {
  const trimmedCountry = country.trim() || "México";
  return `Ya existe un destino registrado como "${name.trim()}" en ${trimmedCountry}.`;
}
