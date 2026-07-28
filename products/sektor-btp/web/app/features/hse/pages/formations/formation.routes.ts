import { Routes } from '@angular/router';

export const FORMATION_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./formation-listing').then((m) => m.FormationListingPage),
    data: { title: 'hse.routes.formation.list.title', breadcrumb: 'hse.routes.formation.list.breadcrumb' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./formation-detail').then((m) => m.FormationDetailPage),
    data: { title: 'hse.routes.formation.create.title', breadcrumb: 'hse.routes.formation.create.breadcrumb' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./formation-detail').then((m) => m.FormationDetailPage),
    data: { title: 'hse.routes.formation.detail.title', breadcrumb: 'hse.routes.formation.detail.breadcrumb' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./formation-detail').then((m) => m.FormationDetailPage),
    data: { title: 'hse.routes.formation.edit.title', breadcrumb: 'hse.routes.formation.edit.breadcrumb', editMode: true },
  },
];
