import { Routes } from '@angular/router';

export const RH_ROUTES: Routes = [
  {
    path: 'rh',
    pathMatch: 'full',
    redirectTo: 'rh/employes',
  },
  {
    path: 'rh/employes',
    loadChildren: () =>
      import('./pages/employes/employe.routes').then((m) => m.EMPLOYE_ROUTES),
  },
  {
    path: 'rh/conges',
    loadChildren: () =>
      import('./pages/conges/conge.routes').then((m) => m.CONGE_ROUTES),
  },
  {
    path: 'rh/paie',
    loadChildren: () =>
      import('./pages/paie/paie.routes').then((m) => m.PAIE_ROUTES),
  },
  {
    path: 'rh/pointage',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/pointage/pointage-listing/pointage-listing.page').then(
        (m) => m.PointageListingPage,
      ),
    data: { titleKey: 'rh.routes.pointage.title', breadcrumbKey: 'rh.routes.pointage.breadcrumb' },
  },
  {
    path: 'rh/pointage/saisie',
    loadComponent: () =>
      import('./pages/pointage/pointage-saisie/pointage-saisie.page').then(
        (m) => m.PointageSaisiePage,
      ),
    data: { titleKey: 'rh.routes.pointageSaisie.title', breadcrumbKey: 'rh.routes.pointageSaisie.breadcrumb' },
  },
  {
    path: 'rh/pointage/validation',
    loadComponent: () =>
      import('./pages/pointage/pointage-validation/pointage-validation.page').then(
        (m) => m.PointageValidationPage,
      ),
    data: { titleKey: 'rh.routes.pointageValidation.title', breadcrumbKey: 'rh.routes.pointageValidation.breadcrumb' },
  },
  {
    path: 'rh/planning-equipes',
    loadComponent: () =>
      import('./pages/planning-equipes/planning-equipes.page').then(
        (m) => m.PlanningEquipesPage,
      ),
    data: { titleKey: 'rh.routes.planning.title', breadcrumbKey: 'rh.routes.planning.breadcrumb' },
  },
];
