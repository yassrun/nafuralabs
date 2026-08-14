/**
 * StockBalance Routes — Generated once (wrapper file).
 */

import { Routes } from '@angular/router';

export const STOCK_BALANCE_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./stock-balance-listing').then(m => m.StockBalanceListingPage),
        data: { titleKey: 'inventory.routes.stockBalances.title', breadcrumbKey: 'inventory.routes.stockBalances.breadcrumb' },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./stock-balance-detail').then(m => m.StockBalanceDetailPage),
        data: { titleKey: 'inventory.suivi.stockBalances.headerTitleNew', breadcrumbKey: 'inventory.routes.articles.newBreadcrumb' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./stock-balance-detail').then(m => m.StockBalanceDetailPage),
        data: { titleKey: 'inventory.suivi.stockBalances.headerTitleDetail', breadcrumbKey: 'inventory.routes.articles.detailBreadcrumb' },
      },
    ],
  },
];
