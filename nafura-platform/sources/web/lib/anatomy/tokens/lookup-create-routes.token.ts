import { InjectionToken } from '@angular/core';

/**
 * Maps lookup keys (e.g. `clients`, `items`) to create-screen routes.
 * Provided by the host app (ERP); empty by default in shells without referentials.
 */
export const LOOKUP_CREATE_ROUTES = new InjectionToken<Readonly<Record<string, string>>>(
  'LOOKUP_CREATE_ROUTES',
  {
    factory: () => ({}),
  },
);
