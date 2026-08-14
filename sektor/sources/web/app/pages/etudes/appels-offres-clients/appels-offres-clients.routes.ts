import { Routes } from '@angular/router';

/**
 * Legacy AOC routes — S5 : redirect vers le parcours dossier unifié.
 */
export const APPELS_OFFRES_CLIENTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/etudes/dossiers',
  },
  {
    path: 'new',
    pathMatch: 'full',
    redirectTo: '/etudes/dossiers/new',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./aoc-to-dossier-redirect.page').then((m) => m.AocToDossierRedirectPage),
    data: { title: 'Redirection AO', breadcrumb: 'AO' },
  },
];
