import { Routes } from '@angular/router';

export const APPROVALS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./approvals.page').then((m) => m.ApprovalsPage),
    data: {
      title: 'Approvals',
      titleI18nKey: 'approvals.title',
    },
  },
];
