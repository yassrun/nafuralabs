import { Routes } from '@angular/router';

export const ACHATS_ROUTES: Routes = [
  {
    path: 'achats',
    pathMatch: 'full',
    redirectTo: 'achats/commandes',
  },
  {
    path: 'achats/fournisseurs',
    loadChildren: () =>
      import('./pages/fournisseurs/fournisseur.routes').then(
        (m) => m.FOURNISSEUR_ROUTES,
      ),
  },
  {
    path: 'achats/demandes',
    loadChildren: () =>
      import('./pages/demandes/demande.routes').then(
        (m) => m.DEMANDE_ROUTES,
      ),
  },
  {
    path: 'achats/appels-offres',
    loadChildren: () =>
      import('./pages/appels-offres/ao.routes').then(
        (m) => m.AO_ROUTES,
      ),
  },
  {
    path: 'achats/commandes',
    loadChildren: () =>
      import('./pages/commandes/bc.routes').then(
        (m) => m.BC_ROUTES,
      ),
  },
  {
    path: 'achats/contrats',
    loadChildren: () =>
      import('./pages/contrats/contrat.routes').then(
        (m) => m.CONTRAT_ROUTES,
      ),
  },
];
