import { Routes } from '@angular/router';

export const DOSSIERS_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./dossier-detail/dossier-detail.page').then((m) => m.DossierDetailPage),
    data: { title: "Dossier d'étude", breadcrumb: 'Dossier' },
  },
];
