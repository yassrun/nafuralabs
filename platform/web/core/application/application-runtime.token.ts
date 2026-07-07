import { InjectionToken } from '@angular/core';

/** Runtime identity for the active product shell (provided by each product app). */
export interface ApplicationRuntimeConfig {
  activeApplicationId: string;
  defaultRoute: string;
  requiresTenant: boolean;
}

const DEFAULT_RUNTIME: ApplicationRuntimeConfig = {
  activeApplicationId: 'unknown',
  defaultRoute: 'feature-unavailable/unknown',
  requiresTenant: true,
};

export const APPLICATION_RUNTIME_CONFIG = new InjectionToken<ApplicationRuntimeConfig>(
  'APPLICATION_RUNTIME_CONFIG',
  { factory: () => DEFAULT_RUNTIME },
);
