import { Routes } from '@angular/router';

export const VENTES_ROUTES: Routes = [
  {
    path: 'ventes',
    pathMatch: 'full',
    redirectTo: 'ventes/factures',
  },
  // Nav alias fixes
  {
    path: 'ventes/commandes',
    redirectTo: 'ventes/bons-commandes-clients',
  },
  {
    path: 'ventes/situations',
    redirectTo: 'chantiers/situations',
  },
  {
    path: 'ventes/clients',
    loadChildren: () =>
      import('./pages/clients/client.routes').then(
        (m) => m.CLIENT_VENTE_ROUTES,
      ),
  },
  {
    path: 'ventes/offres',
    loadChildren: () =>
      import('./pages/offres/offre.routes').then(
        (m) => m.OFFRE_ROUTES,
      ),
  },
  {
    path: 'ventes/bons-commandes-clients',
    loadChildren: () =>
      import('./pages/bons-commandes-clients/bcc.routes').then(
        (m) => m.BCC_ROUTES,
      ),
  },
  {
    path: 'ventes/factures',
    loadChildren: () =>
      import('./pages/factures/factures.routes').then(
        (m) => m.FACTURES_ROUTES,
      ),
  },
  {
    path: 'ventes/avoirs',
    loadChildren: () =>
      import('./pages/avoirs/avoirs.routes').then(
        (m) => m.AVOIRS_ROUTES,
      ),
  },
  {
    path: 'ventes/retenues-garantie',
    loadComponent: () =>
      import(
        './pages/retenues-garantie/retenues-garantie.page'
      ).then((m) => m.RetenuesGarantiePage),
    data: {
      title: 'Retenues garanties',
      breadcrumb: 'Retenues garanties',
    },
  },
];
