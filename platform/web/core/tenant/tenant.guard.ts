/**
 * Tenant Guard
 * 
 * Route guards for tenant-scoped access control.
 * Ensures users have access to the requested tenant.
 */

import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { TenantContextService } from './tenant.context';
import { TenantType } from './tenant.types';
import { AuthFacade } from '../security/services/auth.facade';
import { APPLICATION_DEFAULT_ROUTE, APPLICATION_REQUIRES_TENANT } from '../../../applications/routes.generated';

/**
 * Route data interface for tenant configuration.
 */
export interface TenantRouteData {
  /** Required tenant types to access this route */
  tenantTypes?: TenantType[];

  /** Required feature to be enabled (canonical) */
  requiredFeature?: string;

  /** Redirect path if tenant check fails */
  tenantDeniedRedirect?: string;
}

/**
 * Guard that ensures tenant context is loaded.
 * 
 * For normal users: Requires tenant context
 * For super admin: Allows access (can select tenant later for tenant-scoped operations)
 */
export const tenantRequiredGuard: CanActivateFn = () => {
  const tenantContext = inject(TenantContextService);
  const auth = inject(AuthFacade);
  const router = inject(Router);

  if (!APPLICATION_REQUIRES_TENANT) {
    return true;
  }

  // Super admin can access routes without tenant context
  // They can select a tenant later for tenant-scoped operations
  if (auth.isSuperAdmin()) {
    return true;
  }

  if (tenantContext.hasTenant()) {
    return true;
  }

  // Authenticated users without tenant context should choose a tenant.
  return router.createUrlTree(['/tenant-selection']);
};

/**
 * Guard for /tenant-selection route.
 * Non-tenant applications should never expose tenant selection.
 */
export const tenantSelectionGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (APPLICATION_REQUIRES_TENANT) {
    return true;
  }

  const defaultRoute = APPLICATION_DEFAULT_ROUTE || 'feature-unavailable/unknown';
  const segments = defaultRoute.split('/').filter(Boolean);
  return router.createUrlTree(['/', ...segments]);
};

/**
 * Guard that checks tenant type restrictions.
 * Super admin can access all tenant types.
 * 
 * Usage:
 * ```typescript
 * {
 *   path: 'enterprise-feature',
 *   canActivate: [tenantTypeGuard(['enterprise'])],
 *   component: EnterpriseFeatureComponent
 * }
 * ```
 */
export function tenantTypeGuard(allowedTypes: TenantType[]): CanActivateFn {
  return () => {
    const tenantContext = inject(TenantContextService);
    const auth = inject(AuthFacade);
    const router = inject(Router);

    // Super admin can access all tenant types
    if (auth.isSuperAdmin()) {
      return true;
    }

    if (tenantContext.isTenantType(...allowedTypes)) {
      return true;
    }

    return router.createUrlTree(['/access-denied']);
  };
}

/**
 * Guard that checks if a feature is enabled for the current tenant.
 * Super admin can access all features.
 * 
 * Usage:
 * ```typescript
 * {
 *   path: 'inventory',
 *   canActivate: [featureEnabledGuard('inventory')],
 *   loadChildren: () => import('./inventory/inventory.routes')
 * }
 * ```
 */
export function featureEnabledGuard(featureId: string): CanActivateFn {
  return () => {
    const tenantContext = inject(TenantContextService);
    const auth = inject(AuthFacade);
    const router = inject(Router);

    // Super admin can access all features
    if (auth.isSuperAdmin()) {
      return true;
    }

    if (tenantContext.isFeatureEnabled(featureId)) {
      return true;
    }

    // Redirect to feature not available page
    return router.createUrlTree(['/feature-unavailable', featureId]);
  };
}

/**
 * CanMatch guard for lazy-loaded features.
 * Prevents feature loading if not enabled for tenant.
 * Super admin can access all features.
 */
export function featureCanMatch(featureId: string): CanMatchFn {
  return () => {
    const tenantContext = inject(TenantContextService);
    const auth = inject(AuthFacade);
    
    // Super admin can access all features
    if (auth.isSuperAdmin()) {
      return true;
    }
    
    return tenantContext.isFeatureEnabled(featureId);
  };
}

/**
 * Guard that reads tenant requirements from route data.
 * Super admin bypasses tenant type and feature checks.
 */
export const routeTenantGuard: CanActivateFn = (route, state) => {
  const tenantContext = inject(TenantContextService);
  const auth = inject(AuthFacade);
  const router = inject(Router);

  const data = route.data as TenantRouteData;
  const redirectPath = data.tenantDeniedRedirect ?? '/access-denied';

  // Super admin bypasses all tenant checks
  if (auth.isSuperAdmin()) {
    return true;
  }

  // Check tenant types
    if (data.tenantTypes && data.tenantTypes.length > 0) {
      if (!tenantContext.isTenantType(...data.tenantTypes)) {
        return router.createUrlTree(['/access-denied']);
      }
    }

  // Check required feature
  const requiredFeature = data.requiredFeature;
  if (requiredFeature) {
    if (!tenantContext.isFeatureEnabled(requiredFeature)) {
      return router.createUrlTree(['/feature-unavailable', requiredFeature]);
    }
  }

  return true;
};

/**
 * Combined guard for tenant + feature + permissions.
 * Super admin bypasses all checks.
 * Convenience guard for common use case.
 */
export function fullAccessGuard(config: {
  tenantTypes?: TenantType[];
  featureId?: string;
}): CanActivateFn {
  return () => {
    const tenantContext = inject(TenantContextService);
    const auth = inject(AuthFacade);
    const router = inject(Router);

    // Super admin bypasses all checks
    if (auth.isSuperAdmin()) {
      return true;
    }

    // Check tenant type
    if (config.tenantTypes && config.tenantTypes.length > 0) {
      if (!tenantContext.isTenantType(...config.tenantTypes)) {
        return router.createUrlTree(['/access-denied']);
      }
    }

    if (config.featureId) {
      if (!tenantContext.isFeatureEnabled(config.featureId)) {
        return router.createUrlTree(['/feature-unavailable', config.featureId]);
      }
    }

    return true;
  };
}
