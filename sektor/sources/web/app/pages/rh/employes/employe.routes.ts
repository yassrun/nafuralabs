import { Routes } from '@angular/router';

export const EMPLOYE_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./employe-listing').then((m) => m.EmployeListingPage),
    data: { titleKey: 'rh.routes.employes.title', breadcrumbKey: 'rh.routes.employes.breadcrumb' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./employe-detail').then((m) => m.EmployeDetailPage),
    data: { titleKey: 'rh.routes.employeNew.title', breadcrumbKey: 'rh.routes.employeNew.breadcrumb' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./employe-detail').then((m) => m.EmployeDetailPage),
    data: { titleKey: 'rh.routes.employeDetail.title', breadcrumbKey: 'rh.routes.employeDetail.breadcrumb' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./employe-detail').then((m) => m.EmployeDetailPage),
    data: { titleKey: 'rh.routes.employeEdit.title', breadcrumbKey: 'rh.routes.employeEdit.breadcrumb', editMode: true },
  },
];
