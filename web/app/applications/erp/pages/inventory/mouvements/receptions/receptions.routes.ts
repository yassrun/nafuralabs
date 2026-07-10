import { Routes } from '@angular/router';

export const RECEPTIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./reception-listing.page').then((m) => m.ReceptionListingPage),
    data: { title: 'inventory.routes.receptions.title', breadcrumb: 'inventory.routes.receptions.breadcrumb' },
  },
  {
    path: 'new',
    loadComponent: () => import('./reception-detail/reception-detail.page').then((m) => m.ReceptionDetailPage),
    data: { title: 'inventory.routes.receptions.new', breadcrumb: 'inventory.routes.articles.newBreadcrumb' },
  },
  {
    path: ':id',
    loadComponent: () => import('./reception-detail/reception-detail.page').then((m) => m.ReceptionDetailPage),
    data: { title: 'inventory.routes.receptions.detail', breadcrumb: 'inventory.routes.articles.detailBreadcrumb' },
  },
];
