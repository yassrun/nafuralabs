import { Routes } from '@angular/router';

export const SORTIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./sortie-listing.page').then((m) => m.SortieListingPage),
    data: { title: 'inventory.routes.sorties.title', breadcrumb: 'inventory.routes.sorties.breadcrumb' },
  },
  {
    path: 'new',
    loadComponent: () => import('./sortie-detail.page').then((m) => m.SortieDetailPage),
    data: { title: 'inventory.routes.sorties.new', breadcrumb: 'inventory.routes.articles.newBreadcrumb' },
  },
  {
    path: ':id',
    loadComponent: () => import('./sortie-detail.page').then((m) => m.SortieDetailPage),
    data: { title: 'inventory.routes.sorties.detail', breadcrumb: 'inventory.routes.articles.detailBreadcrumb' },
  },
];
