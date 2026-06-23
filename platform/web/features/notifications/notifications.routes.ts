import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./notification-center.page').then((m) => m.NotificationCenterPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['collaboration.notification.read'],
      title: 'notifications.center.title',
    },
  },
];
