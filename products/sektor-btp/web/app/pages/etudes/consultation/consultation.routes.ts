import { Routes } from '@angular/router';

export const CONSULTATION_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./consultation-listing').then((m) => m.ConsultationListingPage),
    data: { title: 'Consultations', breadcrumb: 'Consultation' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./consultation-create/consultation-create.page').then(
        (m) => m.ConsultationCreatePage,
      ),
    data: { title: 'Nouvelle consultation', breadcrumb: 'Nouvelle' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./consultation-detail').then((m) => m.ConsultationDetailPage),
    data: { title: 'Détail consultation', breadcrumb: 'Détail' },
  },
];
