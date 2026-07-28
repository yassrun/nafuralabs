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
    path: 'etudes/bibliotheque-prix',
    loadChildren: () =>
      import('./pages/bibliotheque-prix/bibliotheque-prix.routes').then(
        (m) => m.BIBLIOTHEQUE_PRIX_ROUTES,
      ),
  },
  {
    path: 'etudes/metres',
    loadChildren: () =>
      import('./pages/metres/metres.routes').then((m) => m.METRES_ROUTES),
  },
  {
    path: 'etudes/devis',
    loadChildren: () =>
      import('./pages/devis/devis.routes').then((m) => m.DEVIS_ROUTES),
  },
  {
    path: 'etudes/dossiers',
    loadChildren: () =>
      import('./pages/dossiers/dossiers.routes').then((m) => m.DOSSIERS_ROUTES),
  },
  {
    path: 'etudes/appels-offres-clients',
    loadChildren: () =>
      import(
        './pages/appels-offres-clients/appels-offres-clients.routes'
      ).then((m) => m.APPELS_OFFRES_CLIENTS_ROUTES),
  },
];
