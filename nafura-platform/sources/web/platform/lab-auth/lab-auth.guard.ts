import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { LabAuthService } from './lab-auth.service';

export const labAuthGuard: CanActivateFn = () => {
  const auth = inject(LabAuthService);
  if (auth.accessToken()) {
    return true;
  }
  return inject(Router).createUrlTree([auth.loginPath()]);
};
