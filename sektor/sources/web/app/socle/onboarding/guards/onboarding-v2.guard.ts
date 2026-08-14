import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

import { environment } from '@env';
import { redirectUnauthenticated } from '@platform/core/security/guards/unauthenticated-redirect';

export const onboardingV2EnabledGuard: CanActivateFn = () => {
  if (environment.onboardingV2Enabled) {
    return true;
  }
  return redirectUnauthenticated();
};
