import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '@core/guards/unsaved-changes.guard';

export const BC_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./bc-listing').then((m) => m.BcListingPage),
    data: { title: 'achats.routes.bcListTitle', breadcrumb: 'achats.routes.bcListCrumb' },
  },
  {
    path: 'new',
    loadComponent: () => import('./bc-detail').then((m) => m.BcDetailPage),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'achats.routes.bcNewTitle', breadcrumb: 'achats.routes.bcNewCrumb' },
  },
  {
    path: ':id',
    loadComponent: () => import('./bc-detail').then((m) => m.BcDetailPage),
    data: { title: 'achats.routes.bcDetailTitle', breadcrumb: 'achats.routes.bcDetailCrumb' },
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./bc-detail').then((m) => m.BcDetailPage),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'achats.routes.bcEditTitle', breadcrumb: 'achats.routes.bcEditCrumb', editMode: true },
  },
];
