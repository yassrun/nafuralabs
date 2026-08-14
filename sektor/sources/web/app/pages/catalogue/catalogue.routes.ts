import { Routes } from '@angular/router';

export const CATALOGUE_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./console/catalogue-console.page').then((m) => m.CatalogueConsolePage),
    data: {
      title: 'Console catalogue Sektor',
      breadcrumb: 'Catalogue',
    },
  },
];
