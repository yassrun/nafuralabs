import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '@core/guards/unsaved-changes.guard';


export const FF_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./ff-listing/ff-listing.page').then((m) => m.FfListingPage),
    data: { title: 'Factures fournisseurs', breadcrumb: 'Factures fournisseurs' },
  },
  {
    path: 'new',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./ff-detail/ff-detail.page').then((m) => m.FfDetailPage),
    data: { title: 'Nouvelle facture fournisseur', breadcrumb: 'Nouvelle' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./ff-detail/ff-detail.page').then((m) => m.FfDetailPage),
    data: { title: 'Facture fournisseur', breadcrumb: 'Détail' },
  },
];
