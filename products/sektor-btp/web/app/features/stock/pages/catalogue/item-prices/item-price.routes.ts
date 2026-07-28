/**
 * ItemPrice Routes — Generated once (wrapper file).
 */

import { Routes } from '@angular/router';

export const ITEM_PRICE_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./item-price-listing').then(m => m.ItemPriceListingPage),
        data: { title: 'Item Prices', breadcrumb: 'Item Prices' },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./item-price-detail').then(m => m.ItemPriceDetailPage),
        data: { title: 'New Item Price', breadcrumb: 'New' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./item-price-detail').then(m => m.ItemPriceDetailPage),
        data: { title: 'Edit Item Price', breadcrumb: 'Edit' },
      },
    ],
  },
];
