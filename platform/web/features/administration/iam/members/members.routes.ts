import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const MEMBERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./member-listing').then((m) => m.MemberListingPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.members.read'],
      title: 'Members',
    },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./member-detail').then((m) => m.MemberDetailPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.members.write'],
      title: 'Invite Member',
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./member-detail').then((m) => m.MemberDetailPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.members.read'],
      title: 'Member Details',
    },
  },
];
