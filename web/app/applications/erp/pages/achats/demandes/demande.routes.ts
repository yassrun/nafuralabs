import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '@core/guards/unsaved-changes.guard';


export const DEMANDE_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./demande-listing').then((m) => m.DemandeListingPage),
    data: { title: 'achats.routes.demandesListTitle', breadcrumb: 'achats.routes.demandesListCrumb' },
  },
  {
    path: 'new',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./demande-detail').then((m) => m.DemandeDetailPage),
    data: { title: 'achats.routes.demandeNewTitle', breadcrumb: 'achats.routes.demandeNewCrumb' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./demande-detail').then((m) => m.DemandeDetailPage),
    data: { title: 'achats.routes.demandeDetailTitle', breadcrumb: 'achats.routes.demandeDetailCrumb' },
  },
  {
    path: ':id/edit',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./demande-detail').then((m) => m.DemandeDetailPage),
    data: { title: 'achats.routes.demandeEditTitle', breadcrumb: 'achats.routes.demandeEditCrumb', editMode: true },
  },
];
