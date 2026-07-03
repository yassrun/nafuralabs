import { Routes } from '@angular/router';

export const FACTURES_MARCHES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./facture-listing/facture-listing.page').then(m => m.FactureMarcheListingPage),
    data: { title: 'marches.routes.facturesTitle', breadcrumb: 'marches.routes.facturesCrumb' },
  },
  {
    path: ':id',
    loadComponent: () => import('./facture-detail/facture-detail.page').then(m => m.FactureMarcheDetailPage),
    data: { title: 'marches.routes.factureDetailTitle', breadcrumb: 'marches.routes.factureDetailCrumb' },
  },
];
