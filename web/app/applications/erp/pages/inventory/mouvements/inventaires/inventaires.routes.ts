import { Routes } from '@angular/router';

export const INVENTAIRES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./inventaire-listing.page').then((m) => m.InventaireListingPage),
    data: { title: 'inventory.routes.inventaires.title', breadcrumb: 'inventory.routes.inventaires.breadcrumb' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./inventaire-detail.page').then((m) => m.InventaireDetailPage),
    data: { title: 'inventory.routes.inventaires.new', breadcrumb: 'inventory.routes.articles.newBreadcrumb' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./inventaire-detail.page').then((m) => m.InventaireDetailPage),
    data: { title: 'inventory.routes.inventaires.detail', breadcrumb: 'inventory.routes.articles.detailBreadcrumb' },
  },
];
