import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';
import { ListingPageComponent } from '../../../platform/listing';
import { EMAIL_TEMPLATES_LISTING } from './email-templates.listing';

export const EMAIL_TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    component: ListingPageComponent,
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.notifications.email-templates.read'],
      title: 'administration.emailTemplates.title',
      listing: EMAIL_TEMPLATES_LISTING,
    },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./email-template-editor').then((m) => m.EmailTemplateEditorPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.notifications.email-templates.create'],
      title: 'administration.emailTemplates.create',
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./email-template-editor').then((m) => m.EmailTemplateEditorPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.notifications.email-templates.read'],
      title: 'administration.emailTemplates.editor.title',
    },
  },
];
