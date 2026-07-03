import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '@core/guards/unsaved-changes.guard';


export const CONGE_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./conge-listing').then((m) => m.CongeListingPage),
    data: { titleKey: 'rh.routes.conges.title', breadcrumbKey: 'rh.routes.conges.breadcrumb' },
  },
  {
    path: 'new',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./conge-detail').then((m) => m.CongeDetailPage),
    data: { titleKey: 'rh.routes.congeNew.title', breadcrumbKey: 'rh.routes.congeNew.breadcrumb' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./conge-detail').then((m) => m.CongeDetailPage),
    data: { titleKey: 'rh.routes.congeDetail.title', breadcrumbKey: 'rh.routes.congeDetail.breadcrumb' },
  },
  {
    path: ':id/edit',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./conge-detail').then((m) => m.CongeDetailPage),
    data: { titleKey: 'rh.routes.congeEdit.title', breadcrumbKey: 'rh.routes.congeEdit.breadcrumb', editMode: true },
  },
];
