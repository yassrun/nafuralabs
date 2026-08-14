import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const AI_PROVIDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ai-providers.page').then((m) => m.AiProvidersPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['tenant.settings.read'],
      title: 'administration.aiProviders.title',
    },
  },
];
