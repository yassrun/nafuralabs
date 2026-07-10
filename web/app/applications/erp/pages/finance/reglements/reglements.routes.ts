import { Routes } from '@angular/router';

export const REGLEMENTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./reglement-listing/reglement-listing.page').then((m) => m.ReglementListingPage),
    data: { title: 'Règlements', breadcrumb: 'Règlements' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./reglement-saisie/reglement-saisie.page').then((m) => m.ReglementSaisiePage),
    data: { title: 'Nouveau règlement', breadcrumb: 'Nouveau' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./reglement-saisie/reglement-saisie.page').then((m) => m.ReglementSaisiePage),
    data: { title: 'Règlement', breadcrumb: 'Détail' },
  },
];
