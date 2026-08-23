import { InjectionToken } from '@angular/core';

/** Server typeahead for a lookup key. Empty query must resolve to []. */
export type LookupSearchFn = (
  query: string,
) => Promise<Array<{ value: string; label: string; disabled?: boolean }>>;

/**
 * Maps lookup keys (`clients`, `fournisseurs`, …) to a server search function.
 * Provided by the host app. Missing key → local filter of dumped options.
 */
export const LOOKUP_SEARCHERS = new InjectionToken<Readonly<Record<string, LookupSearchFn>>>(
  'LOOKUP_SEARCHERS',
  {
    factory: () => ({}),
  },
);
