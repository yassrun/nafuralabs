import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const DOMAIN_ACTIVATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./domain-activation.page').then((m) => m.DomainActivationPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.domains.read'],
      title: 'Domain Activation',
    },
  },
];
