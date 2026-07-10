import { Routes } from '@angular/router';

export const FACTURES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./facture-listing').then((m) => m.FactureListingPage),
    data: { title: 'Factures', breadcrumb: 'Factures' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./facture-detail').then((m) => m.FactureDetailPage),
    data: { title: 'Nouvelle facture', breadcrumb: 'Nouvelle' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./facture-detail').then((m) => m.FactureDetailPage),
    data: { title: 'Détail facture', breadcrumb: 'Détail' },
  },
];
