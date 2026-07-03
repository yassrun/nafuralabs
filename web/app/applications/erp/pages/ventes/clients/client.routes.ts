import { Routes } from '@angular/router';

export const CLIENT_VENTE_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./client-listing').then((m) => m.ClientListingPage),
    data: { title: 'Clients', breadcrumb: 'Clients' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./client-detail').then((m) => m.ClientDetailPage),
    data: { title: 'Nouveau client', breadcrumb: 'Nouveau' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./client-detail').then((m) => m.ClientDetailPage),
    data: { title: 'Détail client', breadcrumb: 'Détail' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./client-detail').then((m) => m.ClientDetailPage),
    data: { title: 'Modifier client', breadcrumb: 'Modifier', editMode: true },
  },
];
