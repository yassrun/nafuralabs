import { Routes } from '@angular/router';

export const FOURNISSEUR_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./fournisseur-listing').then((m) => m.FournisseurListingPage),
    data: { title: 'achats.routes.fournisseurListTitle', breadcrumb: 'achats.routes.fournisseurListCrumb' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./fournisseur-detail').then((m) => m.FournisseurDetailPage),
    data: { title: 'achats.routes.fournisseurNewTitle', breadcrumb: 'achats.routes.fournisseurNewCrumb' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./fournisseur-detail').then((m) => m.FournisseurDetailPage),
    data: { title: 'achats.routes.fournisseurDetailTitle', breadcrumb: 'achats.routes.fournisseurDetailCrumb' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./fournisseur-detail').then((m) => m.FournisseurDetailPage),
    data: { title: 'achats.routes.fournisseurEditTitle', breadcrumb: 'achats.routes.fournisseurEditCrumb', editMode: true },
  },
];
