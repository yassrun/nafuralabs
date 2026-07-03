/**
 * UoMCategory Routes — Generated once (wrapper file).
 */

import { Routes } from '@angular/router';

export const UO_MCATEGORY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./uo-mcategory-listing').then(m => m.UoMCategoryListingPage),
        data: { title: 'Uo M Categories', breadcrumb: 'Uo M Categories' },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./uo-mcategory-detail').then(m => m.UoMCategoryDetailPage),
        data: { title: 'New Uo M Category', breadcrumb: 'New' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./uo-mcategory-detail').then(m => m.UoMCategoryDetailPage),
        data: { title: 'Edit Uo M Category', breadcrumb: 'Edit' },
      },
    ],
  },
];
