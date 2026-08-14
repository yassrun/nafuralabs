import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const MEMBERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./member-listing').then((m) => m.MemberListingPage),
    canActivate: [routePermissionGuard],
    data: {
      permissionsAny: ['administration.members.read', 'tenant.members.read'],
      title: 'Members',
    },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./member-detail').then((m) => m.MemberDetailPage),
    canActivate: [routePermissionGuard],
    data: {
      permissionsAny: ['administration.members.write', 'tenant.members.write'],
      title: 'Invite Member',
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./member-detail').then((m) => m.MemberDetailPage),
    canActivate: [routePermissionGuard],
    data: {
      permissionsAny: ['administration.members.read', 'tenant.members.read'],
      title: 'Member Details',
    },
  },
];
