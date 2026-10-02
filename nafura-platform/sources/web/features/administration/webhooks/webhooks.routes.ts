import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';
import { ListingPageComponent } from '../../../platform/listing';
import { WEBHOOKS_LISTING } from './webhooks.listing';

export const WEBHOOKS_ROUTES: Routes = [
  {
    path: '',
    component: ListingPageComponent,
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.webhooks.read'],
      title: 'administration.webhooks.title',
      listing: WEBHOOKS_LISTING,
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
