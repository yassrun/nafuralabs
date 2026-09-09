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
      import('./employes/employe.routes').then((m) => m.EMPLOYE_ROUTES),
  },
  {
    path: 'rh/postes',
    loadChildren: () =>
      import('./referentiels/rh-nomenclature.routes').then((m) => m.POSTE_RH_ROUTES),
  },
  {
    path: 'rh/departements',
    loadChildren: () =>
      import('./referentiels/rh-nomenclature.routes').then((m) => m.DEPARTEMENT_RH_ROUTES),
  },
  {
    path: 'rh/conges',
    loadChildren: () =>
      import('./conges/conge.routes').then((m) => m.CONGE_ROUTES),
  },
  {
    path: 'rh/paie',
    loadChildren: () =>
      import('./paie/paie.routes').then((m) => m.PAIE_ROUTES),
  },
  {
    path: 'rh/pointage',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pointage/pointage-listing/pointage-listing.page').then(
        (m) => m.PointageListingPage,
      ),
    data: { titleKey: 'rh.routes.pointage.title', breadcrumbKey: 'rh.routes.pointage.breadcrumb' },
  },
  {
    path: 'rh/pointage/saisie',
    loadComponent: () =>
      import('./pointage/pointage-saisie/pointage-saisie.page').then(
        (m) => m.PointageSaisiePage,
      ),
    data: { titleKey: 'rh.routes.pointageSaisie.title', breadcrumbKey: 'rh.routes.pointageSaisie.breadcrumb' },
  },
  {
    path: 'rh/pointage/validation',
    loadComponent: () =>
      import('./pointage/pointage-validation/pointage-validation.page').then(
        (m) => m.PointageValidationPage,
      ),
    data: { titleKey: 'rh.routes.pointageValidation.title', breadcrumbKey: 'rh.routes.pointageValidation.breadcrumb' },
  },
  {
    path: 'rh/planning-equipes',
    loadComponent: () =>
      import('./planning-equipes/planning-equipes.page').then(
        (m) => m.PlanningEquipesPage,
      ),
    data: { titleKey: 'rh.routes.planning.title', breadcrumbKey: 'rh.routes.planning.breadcrumb' },
  },
];
