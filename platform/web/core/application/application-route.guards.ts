/**
 * Application Route Guards
 */

import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { ApplicationKey } from './application-key';
import { ApplicationContextService } from './application-context.service';
import { TenantContextService } from '../tenant/tenant.context';
import { AuthFacade } from '../security/services/auth.facade';
import { APPLICATION_DEFAULT_ROUTE } from '../../../applications/routes.generated';

export function applicationCanMatch(expected: ApplicationKey): CanMatchFn {
  return () => {
    const applicationContext = inject(ApplicationContextService);
    return applicationContext.applicationKey() === expected;
  };
}

export const applicationDefaultRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  const defaultRoute = APPLICATION_DEFAULT_ROUTE || 'feature-unavailable/unknown';
  const routeSegments = defaultRoute.split('/').filter(Boolean);

  return router.createUrlTree(['/', ...routeSegments]);
};

export function applicationFeatureCanMatch(
  featureId: string,
  allowedApplications: ApplicationKey[]
): CanMatchFn {
  return () => {
    const applicationContext = inject(ApplicationContextService);
    const tenantContext = inject(TenantContextService);
    const auth = inject(AuthFacade);

    const currentApplication = applicationContext.applicationKey();
    if (!allowedApplications.includes(currentApplication)) {
      return false;
    }
    if (auth.isSuperAdmin()) {
      return true;
    }
    return tenantContext.isFeatureEnabled(featureId);
  };
}
