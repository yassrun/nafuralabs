/**
 * @deprecated Use `/finance/devises` (FR). Routes redirect to the canonical devises module.
 */

import { Routes } from '@angular/router';

export const CURRENCY_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/finance/devises',
  },
  {
    path: '**',
    redirectTo: '/finance/devises',
  },
];
