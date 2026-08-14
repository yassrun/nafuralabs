import { Routes } from '@angular/router';

export const AVENANTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./avenant-listing/avenant-listing.page').then(m => m.AvenantListingPage),
    data: { title: 'marches.routes.avenantsTitle', breadcrumb: 'marches.routes.avenantsCrumb' },
  },
  {
    path: ':avenantId',
    loadComponent: () => import('./avenant-detail/avenant-detail.page').then(m => m.AvenantDetailPage),
    data: { title: 'marches.routes.avenantDetailTitle', breadcrumb: 'marches.routes.avenantDetailCrumb' },
  },
];
