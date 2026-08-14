import { Routes } from '@angular/router';

export const RETOURS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./retour-listing.page').then((m) => m.RetourListingPage),
    data: { title: 'inventory.routes.retours.title', breadcrumb: 'inventory.routes.retours.breadcrumb' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./retour-detail.page').then((m) => m.RetourDetailPage),
    data: { title: 'inventory.routes.retours.new', breadcrumb: 'inventory.routes.articles.newBreadcrumb' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./retour-detail.page').then((m) => m.RetourDetailPage),
    data: { title: 'inventory.routes.retours.detail', breadcrumb: 'inventory.routes.articles.detailBreadcrumb' },
  },
];
