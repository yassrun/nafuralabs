import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { LabAuthService } from './lab-auth.service';

export const labAuthGuard: CanActivateFn = async () => {
  const auth = inject(LabAuthService);
  const router = inject(Router);
  await auth.ensureSession();
  if (auth.accessToken()) {
    return true;
  }
  return router.createUrlTree([auth.loginPath()]);
};
