import { Routes } from '@angular/router';

export const ORGANIZATION_IDENTITY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./organization-identity.page').then((m) => m.OrganizationIdentityPage),
    data: {
      title: 'Identité organisation',
    },
  },
];
