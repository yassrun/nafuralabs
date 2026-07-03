import { Routes } from '@angular/router';

export const CONDITIONS_PAIEMENT_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./condition-listing').then((m) => m.ConditionListingPage),
    data: { title: 'Conditions de paiement', breadcrumb: 'Conditions' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./condition-detail').then((m) => m.ConditionDetailPage),
    data: { title: 'Nouvelle condition', breadcrumb: 'Nouveau' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./condition-detail').then((m) => m.ConditionDetailPage),
    data: { title: 'Condition de paiement', breadcrumb: 'Détail' },
  },
];
