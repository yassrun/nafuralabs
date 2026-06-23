/**
 * Permission Guards
 *
 * Route guards for permission-based access control.
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn, CanMatchFn, UrlTree, ActivatedRouteSnapshot } from '@angular/router';

import { AuthFacade } from '../services/auth.facade';
import { PermissionService } from '../services/permission.service';
import { Permission } from '../models/user.models';

/**
 * Route data interface for permission configuration.
 */
export interface PermissionRouteData {
  /** Required permissions (AND logic) */
  permissions?: Permission[];
  /** Alternative permissions (OR logic) */
  permissionsAny?: Permission[];
  /** Required feature to be enabled (canonical) */
  requiredFeature?: string;
  /** Custom redirect on denial */
  deniedRedirect?: string;
}

/**
 * Guard factory for permission-based access.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'products',
 *   canActivate: [permissionGuard(['inventory.products.read'])],
 *   component: ProductsComponent
 * }
 * ```
 */
export function permissionGuard(
  permissions: Permission[],
  options?: { mode?: 'all' | 'any'; redirectTo?: string }
): CanActivateFn {
  return (): boolean | UrlTree => {
    const auth = inject(AuthFacade);
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    // Check authentication first
    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    // Super admin bypasses all
    if (auth.isSuperAdmin()) {
      return true;
    }

    // Check permissions
    const mode = options?.mode ?? 'all';
    const hasAccess = mode === 'all'
      ? permissionService.hasAllPermissions(permissions)
      : permissionService.hasAnyPermission(permissions);

    if (hasAccess) {
      return true;
    }

    const redirectPath = options?.redirectTo ?? '/access-denied';
    return router.createUrlTree([redirectPath]);
  };
}

/**
 * Guard that reads permissions from route data.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'products',
 *   canActivate: [routePermissionGuard],
 *   data: {
 *     permissions: ['inventory.products.read'],
 *     requiredFeature: 'inventory'
 *   },
 *   component: ProductsComponent
 * }
 * ```
 */
export const routePermissionGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
): boolean | UrlTree => {
  const auth = inject(AuthFacade);
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  // Check authentication first
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Super admin bypasses all
  if (auth.isSuperAdmin()) {
    return true;
  }

  const data = route.data as PermissionRouteData;
  const redirectPath = data.deniedRedirect ?? '/access-denied';

  // Check required feature
  const requiredFeature = data.requiredFeature;
  if (requiredFeature) {
    if (!permissionService.isFeatureAccessible(requiredFeature)) {
      return router.createUrlTree(['/feature-unavailable', requiredFeature]);
    }
  }

  // Check AND permissions
  if (data.permissions && data.permissions.length > 0) {
    if (!permissionService.hasAllPermissions(data.permissions)) {
      return router.createUrlTree([redirectPath]);
    }
  }

  // Check OR permissions
  if (data.permissionsAny && data.permissionsAny.length > 0) {
    if (!permissionService.hasAnyPermission(data.permissionsAny)) {
      return router.createUrlTree([redirectPath]);
    }
  }

  return true;
};

/**
 * Guard factory for feature-based access.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'inventory',
 *   canActivate: [featureGuard('inventory')],
 *   loadChildren: () => import('./inventory.routes')
 * }
 * ```
 */
export function featureGuard(featureId: string): CanActivateFn {
  return (): boolean | UrlTree => {
    const auth = inject(AuthFacade);
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (!permissionService.isFeatureAccessible(featureId)) {
      return router.createUrlTree(['/feature-unavailable', featureId]);
    }

    return true;
  };
}

/**
 * CanMatch guard for lazy modules with permission check.
 * Prevents module loading if permissions not met.
 */
export function permissionCanMatch(permissions: Permission[]): CanMatchFn {
  return (): boolean => {
    const auth = inject(AuthFacade);
    const permissionService = inject(PermissionService);

    if (!auth.isAuthenticated()) {
      return false;
    }

    if (auth.isSuperAdmin()) {
      return true;
    }

    return permissionService.hasAllPermissions(permissions);
  };
}

/**
 * CanMatch guard for lazy features with feature check.
 */
export function featureCanMatch(featureId: string): CanMatchFn {
  return (): boolean => {
    const auth = inject(AuthFacade);
    const permissionService = inject(PermissionService);

    if (!auth.isAuthenticated()) {
      return false;
    }

    return permissionService.isFeatureAccessible(featureId);
  };
}

