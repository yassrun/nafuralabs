import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';
import { ListingPageComponent } from '@platform/platform/listing';
import { RecordPageComponent, unsavedChangesGuard } from '@platform/platform/record';

import { ROLE_RECORD, ROLES_LISTING } from './roles.record';

export const ROLES_ROUTES: Routes = [
  {
    path: '',
    component: ListingPageComponent,
    canActivate: [routePermissionGuard],
    data: {
      listing: ROLES_LISTING,
      permissionsAny: ['administration.role.read', 'tenant.roles.read'],
      title: 'Roles',
    },
  },
  {
    path: 'new',
    component: RecordPageComponent,
    canActivate: [routePermissionGuard],
    canDeactivate: [unsavedChangesGuard],
    data: {
      record: ROLE_RECORD,
      permissionsAny: ['administration.role.create', 'tenant.roles.write'],
      title: 'New Role',
    },
  },
  {
    path: ':id',
    component: RecordPageComponent,
    canActivate: [routePermissionGuard],
    canDeactivate: [unsavedChangesGuard],
    data: {
      record: ROLE_RECORD,
      permissionsAny: ['administration.role.read', 'tenant.roles.read'],
    },
  },
];
