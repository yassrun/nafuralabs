import { InjectionToken, Provider, inject, APP_INITIALIZER } from '@angular/core';

import { LabAuthService } from './lab-auth.service';

/** Lab identity picker. The app owns the user roster and the two HTTP endpoints. */
export interface LabAuthConfig {
  readonly usersUrl: string;
  readonly sessionUrl: string;
  readonly productName: string;
  /** Product square icon; without it the initial of `productName`. */
  readonly productMark?: string;
  readonly subtitle?: string;
  readonly storageKey?: string;
  readonly loginPath?: string;
  readonly homePath?: string;
  /** Effective permissions of the session (default `/api/v1/me/permissions`). */
  readonly permissionsUrl?: string;
}

export const LAB_AUTH_CONFIG = new InjectionToken<LabAuthConfig>('LAB_AUTH_CONFIG');

export function provideLabAuth(config: LabAuthConfig): Provider[] {
  return [
    { provide: LAB_AUTH_CONFIG, useValue: config },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const auth = inject(LabAuthService);
        return () => auth.ensureSession();
      },
    },
  ];
}
