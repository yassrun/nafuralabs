import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { HostAuthService } from './host-auth.service';

export const hostAuthGuard: CanActivateFn = async () => {
  const auth = inject(HostAuthService);
  const router = inject(Router);
  await auth.ensureSession();
  return auth.accessToken() ? true : router.createUrlTree([auth.loginPath()]);
};
