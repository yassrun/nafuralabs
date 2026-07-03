import { Routes } from '@angular/router';

export const CONTRATS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./contrat-listing/contrat-listing.page').then(m => m.ContratListingPage),
    data: { title: 'marches.routes.contratsTitle', breadcrumb: 'marches.routes.contratsCrumb' },
  },
  {
    path: 'new',
    loadComponent: () => import('./contrat-create/contrat-create.page').then(m => m.ContratCreatePage),
    data: { title: 'marches.routes.contratCreateTitle', breadcrumb: 'marches.routes.contratCreateCrumb' },
  },
  {
    path: ':id',
    loadComponent: () => import('./contrat-detail/contrat-detail.page').then(m => m.ContratDetailPage),
    data: { title: 'marches.routes.contratDetailTitle', breadcrumb: 'marches.routes.contratDetailCrumb' },
  },
];
