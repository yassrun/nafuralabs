/**
 * Item Routes — Generated once (wrapper file).
 */

import { Routes } from '@angular/router';

export const ITEM_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./item-listing').then(m => m.ItemListingPage),
        data: { title: 'Items', breadcrumb: 'Items' },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./item-detail').then(m => m.ItemDetailPage),
        data: { title: 'New Item', breadcrumb: 'New' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./item-detail').then(m => m.ItemDetailPage),
        data: { title: 'Edit Item', breadcrumb: 'Edit' },
      },
    ],
  },
];
