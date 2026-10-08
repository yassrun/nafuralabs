import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';
import { ListingPageComponent } from '@platform/platform/listing';
import { RecordPageComponent, unsavedChangesGuard } from '@platform/platform/record';

import { MEMBER_RECORD, MEMBERS_LISTING } from './members.record';

export const MEMBERS_ROUTES: Routes = [
  {
    path: '',
    component: ListingPageComponent,
    canActivate: [routePermissionGuard],
    data: {
      listing: MEMBERS_LISTING,
      permissionsAny: ['administration.members.read', 'tenant.members.read'],
      title: 'Members',
    },
  },
  {
    path: ':id',
    component: RecordPageComponent,
    canActivate: [routePermissionGuard],
    canDeactivate: [unsavedChangesGuard],
    data: {
      record: MEMBER_RECORD,
      permissionsAny: ['administration.members.read', 'tenant.members.read'],
    },
  },
];
