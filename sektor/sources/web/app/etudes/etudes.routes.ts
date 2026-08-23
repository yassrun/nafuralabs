import { Routes } from '@angular/router';

export const ETUDES_ROUTES: Routes = [
  {
    path: 'etudes',
    pathMatch: 'full',
    redirectTo: 'etudes/devis',
  },
  {
    path: 'etudes/appels-offres',
    redirectTo: 'etudes/appels-offres-clients',
    pathMatch: 'full',
  },
  {
    path: 'etudes/devis',
    loadChildren: () =>
      import('./devis/devis.routes').then((m) => m.DEVIS_ROUTES),
  },
  {
    path: 'etudes/dossiers',
    loadChildren: () =>
      import('./dossiers/dossiers.routes').then((m) => m.DOSSIERS_ROUTES),
  },
  {
    path: 'etudes/appels-offres-clients',
    loadChildren: () =>
      import(
        './appels-offres-clients/appels-offres-clients.routes'
      ).then((m) => m.APPELS_OFFRES_CLIENTS_ROUTES),
  },
];
