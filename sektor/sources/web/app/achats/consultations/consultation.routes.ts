import { Routes } from '@angular/router';

export const CONSULTATION_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./consultation-listing').then((m) => m.ConsultationListingPage),
    data: {
      title: 'achats.routes.consultationsListTitle',
      breadcrumb: 'achats.routes.consultationsListCrumb',
    },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./consultation-create').then((m) => m.ConsultationCreatePage),
    data: {
      title: 'achats.routes.consultationNewTitle',
      breadcrumb: 'achats.routes.consultationNewCrumb',
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./consultation-detail').then((m) => m.ConsultationDetailPage),
    data: {
      title: 'achats.routes.consultationDetailTitle',
      breadcrumb: 'achats.routes.consultationDetailCrumb',
    },
  },
];
