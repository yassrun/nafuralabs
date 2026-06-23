import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { environment } from '@env';

export const onboardingV2EnabledGuard: CanActivateFn = () => {
  if (environment.onboardingV2Enabled) {
    return true;
  }
  return inject(Router).createUrlTree(['/login']);
};
