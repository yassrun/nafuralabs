import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const ROLES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./role-listing').then((m) => m.RoleListingPage),
    canActivate: [routePermissionGuard],
    data: {
      permissionsAny: ['administration.role.read', 'tenant.roles.read'],
      title: 'Roles',
    },
  },
  {
    path: 'new',
    loadComponent: () => import('./role-detail').then((m) => m.RoleDetailPage),
    canActivate: [routePermissionGuard],
    data: {
      permissionsAny: ['administration.role.create', 'tenant.roles.write'],
      title: 'New Role',
    },
  },
  {
    path: ':id',
    loadComponent: () => import('./role-detail').then((m) => m.RoleDetailPage),
    canActivate: [routePermissionGuard],
    data: {
      permissionsAny: ['administration.role.read', 'tenant.roles.read'],
      title: 'Role Details',
    },
  },
];
