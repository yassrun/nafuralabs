import { InjectionToken } from '@angular/core';

/** Result of an overlay picker for a lookup key (e.g. catalogue article). */
export interface LookupPickerResult {
  value: string;
  label: string;
}

/**
 * Opens a rich picker for the current value (or null).
 * Resolve to null when the user cancels.
 */
export type LookupPickerFn = (
  current: string | null,
) => Promise<LookupPickerResult | null>;

/**
 * Maps lookup keys that must not use combobox typeahead (e.g. `items`)
 * to an overlay picker. Provided by the host app.
 */
export const LOOKUP_PICKERS = new InjectionToken<Readonly<Record<string, LookupPickerFn>>>(
  'LOOKUP_PICKERS',
  {
    factory: () => ({}),
  },
);
