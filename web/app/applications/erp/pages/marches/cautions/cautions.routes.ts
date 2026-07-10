import { Routes } from '@angular/router';

export const CAUTIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./caution-listing/caution-listing.page').then(m => m.CautionListingPage),
    data: { title: 'marches.routes.cautionsTitle', breadcrumb: 'marches.routes.cautionsCrumb' },
  },
];
