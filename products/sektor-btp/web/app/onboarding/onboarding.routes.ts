import { Routes } from '@angular/router';

import { guestGuard } from '@core/security/guards/auth.guard';
import { onboardingV2EnabledGuard } from './guards/onboarding-v2.guard';
import { onboardingAuthGuard } from './guards/onboarding-auth.guard';

export const ONBOARDING_V2_ROUTES: Routes = [
  {
    path: 'signup',
    canActivate: [onboardingV2EnabledGuard, guestGuard],
    loadComponent: () =>
      import('./onboarding-layout.component').then((m) => m.OnboardingLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/signup/signup.page').then((m) => m.SignupPage),
      },
      {
        path: 'check-email',
        loadComponent: () =>
          import('./pages/signup/signup-check-email.page').then((m) => m.SignupCheckEmailPage),
      },
      {
        path: 'verify',
        loadComponent: () =>
          import('./pages/signup/signup-verify.page').then((m) => m.SignupVerifyPage),
      },
    ],
  },
  {
    path: 'onboarding',
    canActivate: [onboardingV2EnabledGuard, onboardingAuthGuard],
    loadComponent: () =>
      import('./onboarding-layout.component').then((m) => m.OnboardingLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/onboarding-flow/onboarding-flow.page').then((m) => m.OnboardingFlowPage),
      },
      {
        path: 'chantier',
        loadComponent: () =>
          import('./pages/onboarding-chantier/onboarding-chantier.page').then(
            (m) => m.OnboardingChantierPage
          ),
      },
    ],
  },
];
