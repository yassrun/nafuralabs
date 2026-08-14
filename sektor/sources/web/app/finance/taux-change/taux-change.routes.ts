import { Routes } from '@angular/router';

export const TAUX_CHANGE_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./taux-change-listing').then((m) => m.TauxChangeListingPage),
    data: { title: 'Taux de change', breadcrumb: 'Taux de change' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./taux-change-detail').then((m) => m.TauxChangeDetailPage),
    data: { title: 'Nouveau taux', breadcrumb: 'Nouveau' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./taux-change-detail').then((m) => m.TauxChangeDetailPage),
    data: { title: 'Taux de change', breadcrumb: 'Détail' },
  },
];
