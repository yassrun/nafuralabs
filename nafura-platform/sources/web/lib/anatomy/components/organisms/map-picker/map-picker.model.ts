/**
 * Domain-agnostic map location. No métier semantics — address + coordinates only.
 */
export interface NfMapLocation {
  lat: number | null;
  lng: number | null;
  address: string;
  city: string;
}

export interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  road?: string;
  house_number?: string;
  postcode?: string;
  country?: string;
}

export interface NominatimResult {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: NominatimAddress;
}
