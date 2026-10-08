import { Routes } from '@angular/router';

import { unsavedChangesGuard } from '@core/guards/unsaved-changes.guard';
import { routePermissionGuard } from '@core/security/guards/permission.guard';
import { ListingPageComponent } from '../../../platform/listing';
import { PRINT_TEMPLATES_LISTING } from './templates.listing';

export const TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    component: ListingPageComponent,
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.documents.templates.read'],
      title: 'administration.templates.title',
      listing: PRINT_TEMPLATES_LISTING,
    },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./template-editor').then((m) => m.TemplateEditorPage),
    canActivate: [routePermissionGuard],
    canDeactivate: [unsavedChangesGuard],
    data: {
      permissions: ['administration.documents.templates.create'],
      title: 'administration.templates.create',
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./template-editor').then((m) => m.TemplateEditorPage),
    canActivate: [routePermissionGuard],
    canDeactivate: [unsavedChangesGuard],
    data: {
      permissions: ['administration.documents.templates.read'],
      title: 'administration.templates.editor.title',
    },
  },
];
