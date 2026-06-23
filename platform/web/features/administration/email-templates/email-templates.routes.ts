import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const EMAIL_TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./email-template-listing').then((m) => m.EmailTemplateListingPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.email.read'],
      title: 'administration.emailTemplates.title',
    },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./email-template-editor').then((m) => m.EmailTemplateEditorPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.email.write'],
      title: 'administration.emailTemplates.create',
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./email-template-editor').then((m) => m.EmailTemplateEditorPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.email.read'],
      title: 'administration.emailTemplates.editor.title',
    },
  },
];
