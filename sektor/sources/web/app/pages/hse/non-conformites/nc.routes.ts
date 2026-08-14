import { Routes } from '@angular/router';

export const NC_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./nc-listing').then((m) => m.NcListingPage),
    data: { title: 'hse.routes.nonConformite.list.title', breadcrumb: 'hse.routes.nonConformite.list.breadcrumb' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./nc-detail').then((m) => m.NcDetailPage),
    data: { title: 'hse.routes.nonConformite.create.title', breadcrumb: 'hse.routes.nonConformite.create.breadcrumb' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./nc-detail').then((m) => m.NcDetailPage),
    data: { title: 'hse.routes.nonConformite.detail.title', breadcrumb: 'hse.routes.nonConformite.detail.breadcrumb' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./nc-detail').then((m) => m.NcDetailPage),
    data: { title: 'hse.routes.nonConformite.edit.title', breadcrumb: 'hse.routes.nonConformite.edit.breadcrumb', editMode: true },
  },
];
