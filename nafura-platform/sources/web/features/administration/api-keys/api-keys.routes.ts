import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';
import { LegacyListingPageComponent } from '../../../platform/listing/legacy';
import { API_KEYS_LISTING } from './api-keys.listing';

export const API_KEYS_ROUTES: Routes = [
  {
    path: '',
    component: LegacyListingPageComponent,
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.api-keys.read'],
      title: 'administration.apiKeys.title',
      listing: API_KEYS_LISTING,
    },
  },
];
