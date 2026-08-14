import { Routes } from '@angular/router';

export const INCIDENT_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./incident-listing').then((m) => m.IncidentListingPage),
    data: { title: 'hse.routes.incident.list.title', breadcrumb: 'hse.routes.incident.list.breadcrumb' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./incident-detail').then((m) => m.IncidentDetailPage),
    data: { title: 'hse.routes.incident.create.title', breadcrumb: 'hse.routes.incident.create.breadcrumb' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./incident-detail').then((m) => m.IncidentDetailPage),
    data: { title: 'hse.routes.incident.detail.title', breadcrumb: 'hse.routes.incident.detail.breadcrumb' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./incident-detail').then((m) => m.IncidentDetailPage),
    data: { title: 'hse.routes.incident.edit.title', breadcrumb: 'hse.routes.incident.edit.breadcrumb', editMode: true },
  },
];
