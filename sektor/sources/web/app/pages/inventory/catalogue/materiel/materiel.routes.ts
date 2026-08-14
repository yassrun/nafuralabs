import { Routes } from '@angular/router';

export const MATERIEL_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./materiel-listing').then((m) => m.MaterielListingPage),
        data: {
          title: 'inventory.routes.materielCatalogue.title',
          breadcrumb: 'inventory.routes.materielCatalogue.breadcrumb',
        },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./materiel-detail').then((m) => m.MaterielDetailPage),
        data: {
          title: 'inventory.routes.materielCatalogue.new',
          breadcrumb: 'inventory.routes.articles.newBreadcrumb',
        },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./materiel-detail').then((m) => m.MaterielDetailPage),
        data: {
          title: 'inventory.routes.materielCatalogue.detail',
          breadcrumb: 'inventory.routes.articles.detailBreadcrumb',
        },
      },
    ],
  },
];
