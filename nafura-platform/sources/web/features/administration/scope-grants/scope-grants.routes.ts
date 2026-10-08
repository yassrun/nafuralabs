import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';
import { ListingPageComponent } from '../../../platform/listing';
import { SCOPE_GRANTS_LISTING } from './scope-grants.listing';

export const SCOPE_GRANTS_ROUTES: Routes = [
  {
    path: '',
    component: ListingPageComponent,
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['tenant.members.scope-grant.read'],
      title: 'administration.scopeGrants.title',
      listing: SCOPE_GRANTS_LISTING,
    },
  },
];
