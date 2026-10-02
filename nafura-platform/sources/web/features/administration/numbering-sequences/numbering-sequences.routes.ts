import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';
import { ListingPageComponent } from '../../../platform/listing';
import { NUMBERING_SEQUENCES_LISTING } from './numbering-sequences.listing';

export const NUMBERING_SEQUENCES_ROUTES: Routes = [
  {
    path: '',
    component: ListingPageComponent,
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['settings.sysconfig.numbering-sequence.read'],
      title: 'administration.numberingSequences.title',
      listing: NUMBERING_SEQUENCES_LISTING,
    },
  },
];
