import { APP_INITIALIZER, InjectionToken, type Provider, inject } from '@angular/core';

import { HostAuthService } from './host-auth.service';

/** What the product says about its sign-in screen; how it signs in comes from the backend at runtime. */
export interface HostAuthOptions {
  readonly productName: string;
  /** Product square icon; without it the initial of `productName`. */
  readonly productMark?: string;
  /** Prefix of the tab's session storage keys (one product per origin, but keep them apart anyway). */
  readonly storageKey: string;
  readonly homePath?: string;
}

export const HOST_AUTH_OPTIONS = new InjectionToken<HostAuthOptions>('HOST_AUTH_OPTIONS');

export function provideHostAuth(options: HostAuthOptions): Provider[] {
  return [
    { provide: HOST_AUTH_OPTIONS, useValue: options },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const auth = inject(HostAuthService);
        return async () => {
          await auth.loadConfig();
          // The callback page completes its own sign-in; restoring there would race with it.
          if (!location.pathname.startsWith('/auth/callback')) await auth.ensureSession();
        };
      },
    },
  ];
}
