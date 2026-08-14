import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const SUBSCRIPTIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./subscriptions.page').then((m) => m.SubscriptionsPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.subscriptions.read'],
      title: 'Subscriptions',
    },
  },
];
