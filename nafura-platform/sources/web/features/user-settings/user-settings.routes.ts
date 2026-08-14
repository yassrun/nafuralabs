import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const USER_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./user-settings.page').then((m) => m.UserSettingsPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['user.settings.read'],
      title: 'My Settings',
    },
  },
];
