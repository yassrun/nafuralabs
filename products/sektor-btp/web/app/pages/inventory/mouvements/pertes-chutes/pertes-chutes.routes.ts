import { Routes } from '@angular/router';

export const PERTES_CHUTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./perte-listing.page').then((m) => m.PerteListingPage),
    data: { title: 'inventory.routes.pertesChutes.title', breadcrumb: 'inventory.routes.pertesChutes.breadcrumb' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./perte-detail.page').then((m) => m.PerteDetailPage),
    data: { title: 'inventory.routes.pertesChutes.new', breadcrumb: 'inventory.routes.articles.newBreadcrumb' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./perte-detail.page').then((m) => m.PerteDetailPage),
    data: { title: 'inventory.routes.pertesChutes.detail', breadcrumb: 'inventory.routes.articles.detailBreadcrumb' },
  },
];
