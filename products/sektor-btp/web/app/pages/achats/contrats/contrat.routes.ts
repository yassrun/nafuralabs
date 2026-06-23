import { Routes } from '@angular/router';

export const CONTRAT_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./contrat-listing').then((m) => m.ContratListingPage),
    data: { title: 'achats.routes.contratListTitle', breadcrumb: 'achats.routes.contratListCrumb' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./contrat-detail').then((m) => m.ContratDetailPage),
    data: { title: 'achats.routes.contratNewTitle', breadcrumb: 'achats.routes.contratNewCrumb' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./contrat-detail').then((m) => m.ContratDetailPage),
    data: { title: 'achats.routes.contratDetailTitle', breadcrumb: 'achats.routes.contratDetailCrumb' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./contrat-detail').then((m) => m.ContratDetailPage),
    data: { title: 'achats.routes.contratEditTitle', breadcrumb: 'achats.routes.contratEditCrumb', editMode: true },
  },
];
