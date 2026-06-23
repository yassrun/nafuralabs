import { Routes } from '@angular/router';

export const MARCHES_ROUTES: Routes = [
  {
    path: 'marches',
    pathMatch: 'full',
    redirectTo: 'marches/contrats',
  },
  {
    path: 'marches/contrats',
    loadChildren: () =>
      import('../pages/marches/contrats/contrats.routes').then(m => m.CONTRATS_ROUTES),
  },
  {
    path: 'marches/avenants',
    loadChildren: () =>
      import('../pages/marches/avenants/avenants.routes').then(m => m.AVENANTS_ROUTES),
  },
  {
    path: 'marches/factures',
    loadChildren: () =>
      import('../pages/marches/factures/factures-marches.routes').then(m => m.FACTURES_MARCHES_ROUTES),
  },
  {
    path: 'marches/cautions',
    loadChildren: () =>
      import('../pages/marches/cautions/cautions.routes').then(m => m.CAUTIONS_ROUTES),
  },
  {
    path: 'marches/revisions-prix',
    loadComponent: () =>
      import('../pages/marches/revisions-prix/revisions-prix.page').then(m => m.RevisionsPrixPage),
    data: { title: 'marches.routes.revisionsPrixTitle', breadcrumb: 'marches.routes.revisionsPrixCrumb' },
  },
  {
    path: 'marches/penalites',
    loadComponent: () =>
      import('../pages/marches/penalites/penalites.page').then(m => m.PenalitesPage),
    data: { title: 'marches.routes.penalitesTitle', breadcrumb: 'marches.routes.penalitesCrumb' },
  },
  {
    path: 'marches/dgd',
    loadComponent: () =>
      import('../pages/marches/dgd/dgd-listing.page').then(m => m.DgdListingPage),
    data: { title: 'marches.routes.dgdTitle', breadcrumb: 'marches.routes.dgdCrumb' },
  },
  {
    path: 'marches/os',
    loadComponent: () =>
      import('../pages/marches/os/os-listing.page').then(m => m.OsListingPage),
    data: { title: 'marches.routes.osTitle', breadcrumb: 'marches.routes.osCrumb' },
  },
];
