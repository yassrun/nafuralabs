import { Routes } from '@angular/router';

export const METRES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./metre-listing').then((m) => m.MetreListingPage),
    data: { title: 'Métrés', breadcrumb: 'Métrés' },
  },
  {
    path: 'new',
    loadComponent: () => import('./metre-detail').then((m) => m.MetreDetailPage),
    data: { title: 'Nouveau métré', breadcrumb: 'Nouveau' },
  },
  {
    path: ':id/dpgf',
    loadComponent: () => import('./metre-dpgf/metre-dpgf.page').then((m) => m.MetreDpgfPage),
    data: { title: 'DPGF métré', breadcrumb: 'DPGF' },
  },
  {
    path: ':id',
    loadComponent: () => import('./metre-detail').then((m) => m.MetreDetailPage),
    data: { title: 'Détail métré', breadcrumb: 'Détail' },
  },
];
