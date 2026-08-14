import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const BUDGET_CHANTIER_ROUTES: Routes = [
  {
    path: '',
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['chantiers.budget.read'],
      title: 'Budget chantiers',
    },
    children: [
      {
        path: '',
        loadComponent: () => import('./budget-chantier-listing').then((m) => m.BudgetChantierListingPage),
        data: { title: 'Budget chantiers', breadcrumb: 'Budget chantiers' },
      },
      {
        path: ':id',
        loadComponent: () => import('./budget-chantier-detail').then((m) => m.BudgetChantierDetailPage),
        data: { title: 'Budget chantier', breadcrumb: 'Détail' },
      },
    ],
  },
];
