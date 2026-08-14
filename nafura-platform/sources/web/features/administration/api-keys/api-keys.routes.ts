import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const API_KEYS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./api-keys-listing.page').then((m) => m.ApiKeysListingPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.api-keys.read'],
      title: 'administration.apiKeys.title',
    },
  },
];
