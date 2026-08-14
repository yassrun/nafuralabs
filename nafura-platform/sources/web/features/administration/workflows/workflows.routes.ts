import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const WORKFLOWS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./workflow-listing').then((m) => m.WorkflowListingPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.workflows.read'],
      title: 'administration.workflows.title',
    },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./workflow-editor').then((m) => m.WorkflowEditorPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.workflows.write'],
      title: 'administration.workflows.create',
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./workflow-editor').then((m) => m.WorkflowEditorPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.workflows.read'],
      title: 'administration.workflows.editorTitle',
    },
  },
];
