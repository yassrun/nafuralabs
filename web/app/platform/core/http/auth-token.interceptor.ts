/**
 * Auth Token Interceptor
 *
 * Automatically adds Authorization Bearer token to all API requests.
 * Skips only Keycloak endpoints.
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { AuthFacade } from '../security/services/auth.facade';
import { AuthStateStore } from '../security/state/auth.state';

let authFacadeRef: AuthFacade | undefined;
let authStateRef: AuthStateStore | undefined;

/** Bound at bootstrap (APP_INITIALIZER) so inject() is not required per HTTP request. */
export function bindAuthTokenInterceptorDeps(
  authFacade: AuthFacade,
  authState: AuthStateStore,
): void {
  authFacadeRef = authFacade;
  authStateRef = authState;
}

function resolveAccessToken(): string | null {
  if (!authFacadeRef || !authStateRef) return null;
  return (
    authFacadeRef.accessToken() ??
    authStateRef.loadPersistedSession()?.tokens.accessToken ??
    null
  );
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

  const accessToken = resolveAccessToken();

  if (accessToken) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return next(clonedReq);
  }

  return next(req);
};
