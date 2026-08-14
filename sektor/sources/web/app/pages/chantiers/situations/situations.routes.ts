import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '@core/guards/unsaved-changes.guard';

export const SITUATIONS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./situation-listing').then((m) => m.SituationListingPage),
    data: { title: 'Situations', breadcrumb: 'Situations' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./situation-detail').then((m) => m.SituationDetailPage),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'Nouvelle situation', breadcrumb: 'Nouvelle' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./situation-detail').then((m) => m.SituationDetailPage),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'Détail situation', breadcrumb: 'Détail' },
  },
];
