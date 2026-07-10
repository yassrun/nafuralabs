/**
 * Domain-agnostic Address data model.
 * Used across various domain entities (Supplier, Customer, Organization, Warehouse, etc.)
 * without any semantic coupling to Foundation or specific business logic.
 */

/**
 * Represents a physical or mailing address.
 * All fields are nullable/optional except line1, city, and countryCode.
 */
export interface NfAddress {
  /** Primary address line (street, building) */
  line1: string;
  
  /** Secondary address line (apartment, suite, floor) */
  line2?: string;
  
  /** City or locality */
  city: string;
  
  /** Postal/ZIP code */
  postalCode?: string;
  
  /** State, province, or region */
  region?: string;
  
  /** ISO-like country code (e.g., 'US', 'MA', 'FR') */
  countryCode: string;
  
  /** Additional notes or delivery instructions */
  notes?: string;
}

/**
 * Represents a country option for selection controls.
 */
export interface NfCountryOption {
  /** ISO country code */
  code: string;
  
  /** i18n translation key for the country name */
  labelKey: string;
}

/**
 * Display mode for address components.
 * - 'compact': Shows only essential fields (line1, city, countryCode, postalCode)
 * - 'full': Shows all available fields including line2, region, and notes
 */
export type NfAddressMode = 'compact' | 'full';

/**
 * Validation configuration for address fields.
 * Keys correspond to NfAddress properties; values indicate whether the field is required.
 */
export type NfAddressRequiredConfig = Partial<Record<keyof NfAddress, boolean>>;

/**
 * Default country options with common countries.
 * Can be overridden via component inputs.
 */
export const DEFAULT_COUNTRY_OPTIONS: NfCountryOption[] = [
  { code: 'MA', labelKey: 'Country.Morocco' },
  { code: 'FR', labelKey: 'Country.France' },
  { code: 'ES', labelKey: 'Country.Spain' },
  { code: 'US', labelKey: 'Country.UnitedStates' },
];
