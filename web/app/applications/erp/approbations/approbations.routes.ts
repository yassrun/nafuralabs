import { Routes } from '@angular/router';

export const APPROBATIONS_ERP_ROUTES: Routes = [
  {
    path: 'approbations',
    pathMatch: 'full',
    loadComponent: () =>
      import('../pages/approbations/inbox/inbox.page').then(m => m.ApprobationsInboxPage),
    data: { title: 'dashboard.approbations.routeTitle', breadcrumb: 'dashboard.approbations.routeBreadcrumb' },
  },
];
