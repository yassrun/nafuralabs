import { Routes } from '@angular/router';

export const JOURNAUX_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./journal-listing/journal-listing.page').then(
        (m) => m.JournalListingPage,
      ),
    data: { title: 'Journaux comptables', breadcrumb: 'Journaux' },
  },
  {
    path: 'nouvelle',
    loadComponent: () =>
      import('./ecriture-saisie/ecriture-saisie.page').then(
        (m) => m.EcritureSaisiePage,
      ),
    data: { title: 'Nouvelle écriture', breadcrumb: 'Saisie' },
  },
  {
    path: 'ecritures',
    loadComponent: () =>
      import('./ecritures-listing/ecritures-listing.page').then(
        (m) => m.EcrituresListingPage,
      ),
    data: { title: 'Écritures', breadcrumb: 'Écritures' },
  },
  {
    path: 'ecritures/:id',
    loadComponent: () =>
      import('./ecriture-detail/ecriture-detail.page').then(
        (m) => m.EcritureDetailPage,
      ),
    data: { title: "Détail écriture", breadcrumb: 'Détail' },
  },
];
