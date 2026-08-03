import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  await auth.ensureSession();
  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
