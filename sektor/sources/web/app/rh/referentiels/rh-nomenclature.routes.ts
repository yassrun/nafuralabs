import { Routes } from '@angular/router';

export const POSTE_RH_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./poste-listing.page').then((m) => m.RhPosteListingPage),
    data: { titleKey: 'rh.routes.postes.title', breadcrumbKey: 'rh.routes.postes.breadcrumb' },
  },
  {
    path: 'new',
    loadComponent: () => import('./poste-detail.page').then((m) => m.RhPosteDetailPage),
    data: { titleKey: 'rh.routes.posteNew.title', breadcrumbKey: 'rh.routes.posteNew.breadcrumb' },
  },
  {
    path: ':id',
    loadComponent: () => import('./poste-detail.page').then((m) => m.RhPosteDetailPage),
    data: { titleKey: 'rh.routes.posteDetail.title', breadcrumbKey: 'rh.routes.posteDetail.breadcrumb' },
  },
];

export const DEPARTEMENT_RH_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./departement-listing.page').then((m) => m.RhDepartementListingPage),
    data: {
      titleKey: 'rh.routes.departements.title',
      breadcrumbKey: 'rh.routes.departements.breadcrumb',
    },
  },
  {
    path: 'new',
    loadComponent: () => import('./departement-detail.page').then((m) => m.RhDepartementDetailPage),
    data: {
      titleKey: 'rh.routes.departementNew.title',
      breadcrumbKey: 'rh.routes.departementNew.breadcrumb',
    },
  },
  {
    path: ':id',
    loadComponent: () => import('./departement-detail.page').then((m) => m.RhDepartementDetailPage),
    data: {
      titleKey: 'rh.routes.departementDetail.title',
      breadcrumbKey: 'rh.routes.departementDetail.breadcrumb',
    },
  },
];
