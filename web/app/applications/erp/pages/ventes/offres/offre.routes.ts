import { Routes } from '@angular/router';

export const OFFRE_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./offre-listing').then((m) => m.OffreListingPage),
    data: { title: 'Offres commerciales', breadcrumb: 'Offres' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./offre-detail').then((m) => m.OffreDetailPage),
    data: { title: 'Nouvelle offre', breadcrumb: 'Nouvelle' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./offre-detail').then((m) => m.OffreDetailPage),
    data: { title: 'Détail offre', breadcrumb: 'Détail' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./offre-detail').then((m) => m.OffreDetailPage),
    data: { title: 'Modifier offre', breadcrumb: 'Modifier', editMode: true },
  },
];
