import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';
import { ListingPageComponent } from '../../../platform/listing';
import { API_KEYS_LISTING } from './api-keys.listing';

export const API_KEYS_ROUTES: Routes = [
  {
    path: '',
    component: ListingPageComponent,
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.integrations.api-keys.read'],
      title: 'administration.apiKeys.title',
      listing: API_KEYS_LISTING,
    },
  },
];
