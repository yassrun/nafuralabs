import { Routes } from '@angular/router';

export const DOSSIERS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./dossier-listing/dossier-listing.page').then((m) => m.DossierListingPage),
    data: { title: "Dossiers d'étude", breadcrumb: "Dossiers d'étude" },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./dossier-create/dossier-create.page').then((m) => m.DossierCreatePage),
    data: { title: "Nouveau dossier d'étude", breadcrumb: 'Nouveau' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./dossier-detail/dossier-detail.page').then((m) => m.DossierDetailPage),
    data: { title: "Dossier d'étude", breadcrumb: 'Dossier' },
  },
];
