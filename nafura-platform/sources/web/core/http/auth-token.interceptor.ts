/**
 * Auth Token Interceptor
 *
 * Automatically adds Authorization Bearer token to all API requests.
 * Skips only Keycloak endpoints.
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthFacade } from '../security/services/auth.facade';
import { AuthStateStore } from '../security/state/auth.state';

/** @deprecated No-op kept for call sites; interceptor resolves deps via inject(). */
export function bindAuthTokenInterceptorDeps(
  _authFacade: AuthFacade,
  _authState: AuthStateStore,
): void {
  // Intentionally empty — module-level refs broke under chunk duplication (Bearer missing → 401).
}

const isExternalAuthRequest = (url: string): boolean =>
  url.includes('keycloak') ||
  url.includes('iam.nafura.local') ||
  url.includes('iam.nafuralabs.staging') ||
  url.includes('iam.nafuralabs.com') ||
  url.includes('/protocol/openid-connect/');

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip token for Keycloak endpoints (external auth provider)
  if (isExternalAuthRequest(req.url)) {
    return next(req);
  }

  // Public API routes must not send a stale Bearer token (would cause 401 on signup, etc.)
  if (req.url.includes('/api/public/')) {
    return next(req);
  }

  const authFacade = inject(AuthFacade);
  const authState = inject(AuthStateStore);
  const accessToken =
    authFacade.accessToken() ??
    authState.loadPersistedSession()?.tokens.accessToken ??
    null;

  if (accessToken) {
    return next(
      req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    );
  }

  return next(req);
};
