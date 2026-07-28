/**
 * PaymentTerm Routes — Generated once (wrapper file).
 */

import { Routes } from '@angular/router';

export const PAYMENT_TERM_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./payment-term-listing').then(m => m.PaymentTermListingPage),
        data: { title: 'Payment Terms', breadcrumb: 'Payment Terms' },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./payment-term-detail').then(m => m.PaymentTermDetailPage),
        data: { title: 'New Payment Term', breadcrumb: 'New' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./payment-term-detail').then(m => m.PaymentTermDetailPage),
        data: { title: 'Edit Payment Term', breadcrumb: 'Edit' },
      },
    ],
  },
];
