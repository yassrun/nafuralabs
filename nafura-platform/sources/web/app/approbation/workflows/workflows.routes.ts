import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';
import { ListingPageComponent } from '../../../platform/listing';
import { WORKFLOWS_LISTING } from './workflows.listing';

export const WORKFLOWS_ROUTES: Routes = [
  {
    path: '',
    component: ListingPageComponent,
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.approvals.workflows.read'],
      title: 'administration.workflows.title',
      listing: WORKFLOWS_LISTING,
    },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./workflow-editor').then((m) => m.WorkflowEditorPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.approvals.workflows.create'],
      title: 'administration.workflows.create',
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./workflow-editor').then((m) => m.WorkflowEditorPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.approvals.workflows.read'],
      title: 'administration.workflows.editorTitle',
    },
  },
];
