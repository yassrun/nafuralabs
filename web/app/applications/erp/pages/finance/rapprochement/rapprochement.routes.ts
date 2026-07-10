import { Routes } from '@angular/router';

export const RAPPROCHEMENT_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./rapprochement.page').then((m) => m.RapprochementPage),
    data: { title: 'Rapprochement bancaire', breadcrumb: 'Rapprochement' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./rapprochement.page').then((m) => m.RapprochementPage),
    data: { title: 'Rapprochement', breadcrumb: 'Détail' },
  },
];
