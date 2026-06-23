import { Routes } from '@angular/router';

export const CAISSES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./caisses-listing/caisses-listing.page').then((m) => m.CaissesListingPage),
    data: { title: 'Caisses & banques', breadcrumb: 'Caisses' },
  },
  {
    path: ':id/mouvements',
    loadComponent: () =>
      import('./mouvements-listing/mouvements-listing.page').then(
        (m) => m.MouvementsListingPage,
      ),
    data: { title: 'Mouvements', breadcrumb: 'Mouvements' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./compte-detail/compte-detail.page').then((m) => m.CompteDetailPage),
    data: { title: 'Compte', breadcrumb: 'Compte' },
  },
];
