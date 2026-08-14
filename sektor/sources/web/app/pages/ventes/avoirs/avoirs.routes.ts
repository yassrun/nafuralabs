import { Routes } from '@angular/router';

export const AVOIRS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./avoir-listing').then((m) => m.AvoirListingPage),
    data: { title: 'Avoirs', breadcrumb: 'Avoirs' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./avoir-detail').then((m) => m.AvoirDetailPage),
    data: { title: 'Nouvel avoir', breadcrumb: 'Nouvel' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./avoir-detail').then((m) => m.AvoirDetailPage),
    data: { title: 'Détail avoir', breadcrumb: 'Détail' },
  },
];
