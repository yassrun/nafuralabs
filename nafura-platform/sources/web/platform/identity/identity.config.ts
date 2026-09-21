import { InjectionToken, Provider } from '@angular/core';

import { PlatformIdentityConfig } from './identity.types';

export const PLATFORM_IDENTITY_CONFIG = new InjectionToken<PlatformIdentityConfig>(
  'PLATFORM_IDENTITY_CONFIG',
  { factory: () => ({ mode: 'keycloak' }) },
);

export function providePlatformIdentity(config: PlatformIdentityConfig = {}): Provider {
  return { provide: PLATFORM_IDENTITY_CONFIG, useValue: config };
}
