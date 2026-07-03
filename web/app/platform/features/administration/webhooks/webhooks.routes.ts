import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const WEBHOOKS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./webhooks-listing.page').then((m) => m.WebhooksListingPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.webhooks.read'],
      title: 'administration.webhooks.title',
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./webhook-detail.page').then((m) => m.WebhookDetailPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.webhooks.read'],
      title: 'administration.webhooks.detail.title',
    },
  },
];
