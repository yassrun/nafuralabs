import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

import { AuthFacade } from '@core/security/services/auth.facade';
import { redirectUnauthenticated } from '@platform/core/security/guards/unauthenticated-redirect';

export const onboardingAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  if (auth.isAuthenticated()) {
    return true;
  }
  return redirectUnauthenticated('/onboarding');
};
