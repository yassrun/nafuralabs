import { Routes } from '@angular/router';

export const DEVISES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./devise-listing').then((m) => m.DeviseListingPage),
    data: {
      titleKey: 'finance.devise.entityNamePlural',
      breadcrumbKey: 'finance.devise.entityNamePlural',
    },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./devise-detail').then((m) => m.DeviseDetailPage),
    data: {
      titleKey: 'finance.devise.actionNew',
      breadcrumbKey: 'finance.common.actions.new',
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./devise-detail').then((m) => m.DeviseDetailPage),
    data: {
      titleKey: 'finance.devise.entityName',
      breadcrumbKey: 'finance.devise.detailBreadcrumb',
    },
  },
];
