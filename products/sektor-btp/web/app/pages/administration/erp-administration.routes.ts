import { Routes } from '@angular/router';

import { ADMINISTRATION_ROUTES as PLATFORM_ADMINISTRATION_ROUTES } from '@platform/features/administration/administration.routes';

/**
 * Sektor BTP — administration routes (platform shell + ERP-specific pages).
 * ERP métier pages live under `products/sektor-btp/web/app/pages/administration/`.
 */
export const ERP_ADMINISTRATION_ROUTES: Routes = [
  ...PLATFORM_ADMINISTRATION_ROUTES,
  {
    path: 'societe',
    loadComponent: () =>
      import('./societe/societe.page').then((m) => m.SocietePage),
    data: { title: 'Identité société', breadcrumb: 'Société' },
  },
  {
    path: 'parametres-fiscal',
    loadComponent: () =>
      import('./parametres-fiscal/parametres-fiscal.page').then(
        (m) => m.ParametresFiscalPage
      ),
    data: { title: 'Paramètres fiscaux', breadcrumb: 'Paramètres fiscaux' },
  },
  {
    path: 'demo',
    loadComponent: () =>
      import('./demo-reset/demo-reset.page').then((m) => m.DemoResetPage),
    data: { title: 'Jeu de données démo', breadcrumb: 'Démo' },
  },
];
