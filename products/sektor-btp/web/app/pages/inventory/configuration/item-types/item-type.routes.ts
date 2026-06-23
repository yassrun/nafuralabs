/**
 * ItemType Routes — Generated once (wrapper file).
 */

import { Routes } from '@angular/router';

export const ITEM_TYPE_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./item-type-listing').then(m => m.ItemTypeListingPage),
        data: { title: 'Item Types', breadcrumb: 'Item Types' },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./item-type-detail').then(m => m.ItemTypeDetailPage),
        data: { title: 'New Item Type', breadcrumb: 'New' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./item-type-detail').then(m => m.ItemTypeDetailPage),
        data: { title: 'Edit Item Type', breadcrumb: 'Edit' },
      },
    ],
  },
];
