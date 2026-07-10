import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./template-listing').then((m) => m.TemplateListingPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.templates.read'],
      title: 'administration.templates.title',
    },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./template-editor').then((m) => m.TemplateEditorPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.templates.write'],
      title: 'administration.templates.create',
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./template-editor').then((m) => m.TemplateEditorPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.templates.read'],
      title: 'administration.templates.editor.title',
    },
  },
];
