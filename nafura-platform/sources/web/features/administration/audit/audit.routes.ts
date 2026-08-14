import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const AUDIT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./audit-log.page').then((m) => m.AuditLogPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.audit.read'],
      title: 'Audit Log',
    },
  },
];
