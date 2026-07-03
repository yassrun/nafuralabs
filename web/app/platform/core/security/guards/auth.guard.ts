/**
 * Auth Guards
 *
 * Route guards for authentication protection.
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn, CanMatchFn, UrlTree } from '@angular/router';

import { AuthFacade } from '../services/auth.facade';

/**
 * Guard that requires authentication.
 * Redirects to login if not authenticated.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'dashboard',
 *   canActivate: [authGuard],
 *   component: DashboardComponent
 * }
 * ```
 */
export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthFacade);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  // Store intended URL for redirect after login
  const currentUrl = router.routerState.snapshot.url;
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: currentUrl },
  });
};

/**
 * Guard that requires authentication + tenant selection.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'app',
 *   canActivate: [authWithTenantGuard],
 *   children: [...]
 * }
 * ```
 */
export const authWithTenantGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthFacade);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    const currentUrl = router.routerState.snapshot.url;
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: currentUrl },
    });
  }

  return true;
};

/**
 * Guard for guest-only routes (login, register).
 * Redirects to dashboard if already authenticated.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'login',
 *   canActivate: [guestGuard],
 *   component: LoginComponent
 * }
 * ```
 */
export const guestGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthFacade);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }

  return true;
};

/**
 * CanMatch guard for lazy-loaded modules requiring auth.
 * Prevents module loading if not authenticated.
 */
export const authCanMatch: CanMatchFn = (): boolean => {
  const auth = inject(AuthFacade);
  return auth.isAuthenticated();
};

/**
 * Guard factory for super admin only routes.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'admin',
 *   canActivate: [superAdminGuard],
 *   component: AdminComponent
 * }
 * ```
 */
export const superAdminGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthFacade);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (!auth.isSuperAdmin()) {
    return router.createUrlTree(['/access-denied']);
  }

  return true;
};

/**
 * Guard factory that checks for specific role.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'admin',
 *   canActivate: [roleGuard('tenant_admin')],
 *   component: AdminComponent
 * }
 * ```
 */
export function roleGuard(role: string): CanActivateFn {
  return (): boolean | UrlTree => {
    const auth = inject(AuthFacade);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (!auth.hasRole(role) && !auth.isSuperAdmin()) {
      return router.createUrlTree(['/access-denied']);
    }

    return true;
  };
}

/**
 * Guard factory that checks for any of the specified roles.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'manage',
 *   canActivate: [anyRoleGuard(['tenant_admin', 'manager'])],
 *   component: ManageComponent
 * }
 * ```
 */
export function anyRoleGuard(roles: string[]): CanActivateFn {
  return (): boolean | UrlTree => {
    const auth = inject(AuthFacade);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (!auth.hasAnyRole(roles) && !auth.isSuperAdmin()) {
      return router.createUrlTree(['/access-denied']);
    }

    return true;
  };
}
