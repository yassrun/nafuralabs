import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthFacade } from '@core/security/services/auth.facade';

export const onboardingAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: '/onboarding' } });
};
