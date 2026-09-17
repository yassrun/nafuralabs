import { findVilleByNom } from '../../../../referentiels/geo-ma';
import type { NominatimAddress, NominatimResult } from './map-picker.model';

const CITY_KEYS: (keyof NominatimAddress)[] = [
  'city',
  'town',
  'village',
  'municipality',
  'county',
];

/** Prefer a canonical Moroccan city name when Nominatim matches the referential. */
export function cityFromNominatim(address: NominatimAddress | undefined): string {
  if (!address) return '';
  for (const key of CITY_KEYS) {
    const raw = address[key]?.trim();
    if (!raw) continue;
    const known = findVilleByNom(raw);
    if (known) return known.nom;
  }
  for (const key of CITY_KEYS) {
    const raw = address[key]?.trim();
    if (raw) return raw;
  }
  return address.state?.trim() ?? '';
}

export function locationFromNominatim(hit: NominatimResult): {
  lat: number;
  lng: number;
  address: string;
  city: string;
} | null {
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const road = [hit.address?.house_number, hit.address?.road].filter(Boolean).join(' ');
  const city = cityFromNominatim(hit.address);
  const address = (road || hit.display_name || '').trim();
  return { lat, lng, address, city };
}
