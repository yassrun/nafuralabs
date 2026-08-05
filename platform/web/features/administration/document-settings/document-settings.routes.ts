import { Routes } from '@angular/router';

import { unsavedChangesGuard } from '@core/guards/unsaved-changes.guard';
import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const DOCUMENT_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./document-settings.page').then((m) => m.DocumentSettingsPage),
    canActivate: [routePermissionGuard],
    canDeactivate: [unsavedChangesGuard],
    data: {
      permissions: ['administration.templates.read'],
      title: 'administration.documentSettings.title',
    },
  },
];
