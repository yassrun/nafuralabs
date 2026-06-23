/**
 * Auto-generated feature route stub for 'sysconfig'.
 * Replace this stub with concrete feature routes.
 * Default behavior redirects to feature-unavailable so the app never renders a blank page.
 */

import { Routes } from '@angular/router';

export const SYSCONFIG_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/feature-unavailable/sysconfig',
  },
  {
    path: '**',
    redirectTo: '/feature-unavailable/sysconfig',
  },
];
