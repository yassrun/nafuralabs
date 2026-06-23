import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const ROLES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./role-listing').then((m) => m.RoleListingPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.role.read'],
      title: 'Roles',
    },
  },
  {
    path: 'new',
    loadComponent: () => import('./role-detail').then((m) => m.RoleDetailPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.role.create'],
      title: 'New Role',
    },
  },
  {
    path: ':id',
    loadComponent: () => import('./role-detail').then((m) => m.RoleDetailPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.role.read'],
      title: 'Role Details',
    },
  },
];
