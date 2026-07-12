/**
 * Shared redirect when a route requires authentication.
 * Staging: direct Keycloak redirect (skip /login splash).
 * Other envs: /login hub (legacy UX + dev mock wizard).
 */

import { inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';

import { AuthFacade } from '../services/auth.facade';

export function redirectUnauthenticated(returnUrl?: string | null): false | UrlTree {
  const auth = inject(AuthFacade);
  const router = inject(Router);

  if (auth.usesDirectKeycloakLogin()) {
    void auth.loginWithReturnUrl(returnUrl ?? undefined);
    return false;
  }

  if (returnUrl?.startsWith('/')) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
  }

  return router.createUrlTree(['/login']);
}
