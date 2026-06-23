import { Routes } from '@angular/router';

export const COSTING_METHOD_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./costing-method-listing').then((m) => m.CostingMethodListingPage),
        data: { title: 'inventory.routes.costingMethods.title', breadcrumb: 'inventory.routes.costingMethods.breadcrumb' },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./costing-method-detail').then((m) => m.CostingMethodDetailPage),
        data: { title: 'inventory.routes.costingMethods.new', breadcrumb: 'inventory.routes.articles.newBreadcrumb' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./costing-method-detail').then((m) => m.CostingMethodDetailPage),
        data: { title: 'inventory.routes.costingMethods.detail', breadcrumb: 'inventory.routes.articles.detailBreadcrumb' },
      },
    ],
  },
];
