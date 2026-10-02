import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const APP_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./app-settings.page').then((m) => m.AppSettingsPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['tenant.settings.write'],
      title: 'Paramètres de l’organisation',
    },
  },
];
