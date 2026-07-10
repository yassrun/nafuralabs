/**
 * ExchangeRate Routes — Generated once (wrapper file).
 */

import { Routes } from '@angular/router';

export const EXCHANGE_RATE_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./exchange-rate-listing').then(m => m.ExchangeRateListingPage),
        data: { title: 'Exchange Rates', breadcrumb: 'Exchange Rates' },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./exchange-rate-detail').then(m => m.ExchangeRateDetailPage),
        data: { title: 'New Exchange Rate', breadcrumb: 'New' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./exchange-rate-detail').then(m => m.ExchangeRateDetailPage),
        data: { title: 'Edit Exchange Rate', breadcrumb: 'Edit' },
      },
    ],
  },
];
