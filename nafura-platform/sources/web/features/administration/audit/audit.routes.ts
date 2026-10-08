import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';
import { ListingPageComponent } from '../../../platform/listing';
import { AUDIT_LISTING } from './audit.listing';

export const AUDIT_ROUTES: Routes = [
  {
    path: '',
    component: ListingPageComponent,
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.audit.log.read'],
      title: 'administration.audit.title',
      listing: AUDIT_LISTING,
    },
  },
  {
    path: ':id',
    loadComponent: () => import('./audit-detail.page').then((m) => m.AuditDetailPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.audit.log.read'],
      title: 'administration.audit.detail.title',
    },
  },
];
