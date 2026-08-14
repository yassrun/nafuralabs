import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const NUMBERING_SEQUENCES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./numbering-sequences-listing.page').then(
        (m) => m.NumberingSequencesListingPage
      ),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['settings.sysconfig.numbering-sequence.read'],
      title: 'administration.numberingSequences.title',
    },
  },
];
