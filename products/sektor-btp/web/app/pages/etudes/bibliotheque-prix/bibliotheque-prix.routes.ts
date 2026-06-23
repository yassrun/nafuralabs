import { Routes } from '@angular/router';

export const BIBLIOTHEQUE_PRIX_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./ouvrage-listing').then((m) => m.OuvrageListingPage),
    data: { title: 'Bibliothèque de prix', breadcrumb: 'Bibliothèque' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./ouvrage-detail').then((m) => m.OuvrageDetailPage),
    data: { title: 'Nouvel ouvrage', breadcrumb: 'Nouveau' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./ouvrage-detail').then((m) => m.OuvrageDetailPage),
    data: { title: 'Détail ouvrage', breadcrumb: 'Détail' },
  },
];
