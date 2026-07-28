import { Routes } from '@angular/router';

export const PLAN_COMPTABLE_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./plan-comptable.page').then((m) => m.PlanComptablePage),
    data: { title: 'Plan comptable', breadcrumb: 'Plan comptable' },
  },
];
