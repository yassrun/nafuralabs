import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '@env';

import { AuthFacade } from '@core/security/services/auth.facade';
import { TokenService } from '@core/security/services/token.service';
import { OnboardingApiService } from '../services/onboarding-api.service';

/**
 * Blocks ERP shell routes until onboarding questionnaire is completed
 * for users still on the backend onboarding JWT.
 */
export const onboardingCompleteGuard: CanActivateFn = async () => {
  if (!environment.onboardingV2Enabled) {
    return true;
  }

  const auth = inject(AuthFacade);
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (!auth.isAuthenticated() || auth.isSuperAdmin()) {
    return true;
  }

  const accessToken = auth.accessToken();
  if (!accessToken || !tokenService.isBackendOnboardingToken(accessToken)) {
    return true;
  }

  try {
    const state = await inject(OnboardingApiService).getState();
    if (state.completed) {
      return true;
    }
  } catch {
    // fall through to onboarding
  }

  return router.createUrlTree(['/onboarding']);
};
