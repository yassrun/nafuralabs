import { Routes } from '@angular/router';

export const TRANSFERTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./transfert-listing.page').then((m) => m.TransfertListingPage),
    data: { title: 'inventory.routes.transferts.title', breadcrumb: 'inventory.routes.transferts.breadcrumb' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./transfert-detail.page').then((m) => m.TransfertDetailPage),
    data: { title: 'inventory.routes.transferts.new', breadcrumb: 'inventory.routes.articles.newBreadcrumb' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./transfert-detail.page').then((m) => m.TransfertDetailPage),
    data: { title: 'inventory.routes.transferts.detail', breadcrumb: 'inventory.routes.articles.detailBreadcrumb' },
  },
];
