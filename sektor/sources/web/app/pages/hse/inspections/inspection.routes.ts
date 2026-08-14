import { Routes } from '@angular/router';

export const INSPECTION_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./inspection-listing').then((m) => m.InspectionListingPage),
    data: { title: 'hse.routes.inspection.list.title', breadcrumb: 'hse.routes.inspection.list.breadcrumb' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./inspection-detail').then((m) => m.InspectionDetailPage),
    data: { title: 'hse.routes.inspection.create.title', breadcrumb: 'hse.routes.inspection.create.breadcrumb' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./inspection-detail').then((m) => m.InspectionDetailPage),
    data: { title: 'hse.routes.inspection.detail.title', breadcrumb: 'hse.routes.inspection.detail.breadcrumb' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./inspection-detail').then((m) => m.InspectionDetailPage),
    data: { title: 'hse.routes.inspection.edit.title', breadcrumb: 'hse.routes.inspection.edit.breadcrumb', editMode: true },
  },
];
