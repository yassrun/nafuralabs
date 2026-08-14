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
      import('./contrats/contrats.routes').then(m => m.CONTRATS_ROUTES),
  },
  {
    path: 'marches/avenants',
    loadChildren: () =>
      import('./avenants/avenants.routes').then(m => m.AVENANTS_ROUTES),
  },
  {
    path: 'marches/factures',
    loadChildren: () =>
      import('./factures/factures-marches.routes').then(m => m.FACTURES_MARCHES_ROUTES),
  },
  {
    path: 'marches/cautions',
    loadChildren: () =>
      import('./cautions/cautions.routes').then(m => m.CAUTIONS_ROUTES),
  },
  {
    path: 'marches/revisions-prix',
    loadComponent: () =>
      import('./revisions-prix/revisions-prix.page').then(m => m.RevisionsPrixPage),
    data: { title: 'marches.routes.revisionsPrixTitle', breadcrumb: 'marches.routes.revisionsPrixCrumb' },
  },
  {
    path: 'marches/penalites',
    loadComponent: () =>
      import('./penalites/penalites.page').then(m => m.PenalitesPage),
    data: { title: 'marches.routes.penalitesTitle', breadcrumb: 'marches.routes.penalitesCrumb' },
  },
  {
    path: 'marches/dgd',
    loadComponent: () =>
      import('./dgd/dgd-listing.page').then(m => m.DgdListingPage),
    data: { title: 'marches.routes.dgdTitle', breadcrumb: 'marches.routes.dgdCrumb' },
  },
  {
    path: 'marches/os',
    loadComponent: () =>
      import('./os/os-listing.page').then(m => m.OsListingPage),
    data: { title: 'marches.routes.osTitle', breadcrumb: 'marches.routes.osCrumb' },
  },
];
