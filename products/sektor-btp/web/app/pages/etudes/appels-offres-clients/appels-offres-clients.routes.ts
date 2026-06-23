import { Routes } from '@angular/router';

export const APPELS_OFFRES_CLIENTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./aoc-listing').then((m) => m.AOCListingPage),
    data: { title: "Appels d'offres clients", breadcrumb: "Appels d'offres clients" },
  },
  {
    path: 'new',
    loadComponent: () => import('./aoc-detail').then((m) => m.AOCDetailPage),
    data: { title: 'Nouveau AO', breadcrumb: 'Nouveau' },
  },
  {
    path: ':id',
    loadComponent: () => import('./aoc-detail').then((m) => m.AOCDetailPage),
    data: { title: 'Détail AO', breadcrumb: 'Détail' },
  },
];
