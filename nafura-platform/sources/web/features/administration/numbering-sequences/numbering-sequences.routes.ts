import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';
import { LegacyListingPageComponent } from '../../../platform/listing/legacy';
import { NUMBERING_SEQUENCES_LISTING } from './numbering-sequences.listing';

export const NUMBERING_SEQUENCES_ROUTES: Routes = [
  {
    path: '',
    component: LegacyListingPageComponent,
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['settings.sysconfig.numbering-sequence.read'],
      title: 'administration.numberingSequences.title',
      listing: NUMBERING_SEQUENCES_LISTING,
    },
  },
];
