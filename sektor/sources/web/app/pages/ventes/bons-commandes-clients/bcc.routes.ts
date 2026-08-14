import { Routes } from '@angular/router';

export const BCC_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./bcc-listing').then((m) => m.BccListingPage),
    data: { title: 'Bons de commande clients', breadcrumb: 'BCC' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./bcc-detail').then((m) => m.BccDetailPage),
    data: { title: 'Nouveau BCC', breadcrumb: 'Nouveau' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./bcc-detail').then((m) => m.BccDetailPage),
    data: { title: 'Détail BCC', breadcrumb: 'Détail' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./bcc-detail').then((m) => m.BccDetailPage),
    data: { title: 'Modifier BCC', breadcrumb: 'Modifier', editMode: true },
  },
];
