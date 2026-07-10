import { Routes } from '@angular/router';

const HSE_BASE_ROUTES: Routes = [
  { path: 'hse', pathMatch: 'full', redirectTo: 'hse/tableau-bord' },
  {
    path: 'hse/tableau-bord',
    loadComponent: () =>
      import('../pages/hse/tableau-bord-hse/tableau-bord-hse.page').then((m) => m.TableauBordHsePage),
    data: { title: 'Tableau de bord HSE', breadcrumb: 'Tableau de bord' },
  },
  {
    path: 'hse/epi',
    loadChildren: () =>
      import('../pages/hse/epi/epi.routes').then((m) => m.EPI_ROUTES),
    data: { title: 'Registre EPI', breadcrumb: 'EPI' },
  },
  {
    path: 'hse/incidents',
    loadChildren: () =>
      import('../pages/hse/incidents/incident.routes').then((m) => m.INCIDENT_ROUTES),
  },
  {
    path: 'hse/non-conformites',
    loadChildren: () =>
      import('../pages/hse/non-conformites/nc.routes').then((m) => m.NC_ROUTES),
  },
  {
    path: 'hse/inspections',
    loadChildren: () =>
      import('../pages/hse/inspections/inspection.routes').then((m) => m.INSPECTION_ROUTES),
  },
  {
    path: 'hse/formations',
    loadChildren: () =>
      import('../pages/hse/formations/formation.routes').then((m) => m.FORMATION_ROUTES),
  },
  {
    path: 'hse/duer',
    loadComponent: () =>
      import('../pages/hse/duer/duer-listing.page').then((m) => m.DuerListingPage),
    data: { title: 'DUER', breadcrumb: 'DUER' },
  },
  {
    path: 'hse/ppsps',
    loadComponent: () =>
      import('../pages/hse/ppsps/ppsps-listing.page').then((m) => m.PpspsListingPage),
    data: { title: 'PPSPS', breadcrumb: 'PPSPS' },
  },
  {
    path: 'hse/phs',
    loadComponent: () =>
      import('../pages/hse/phs/phs-listing.page').then((m) => m.PhsListingPage),
    data: { title: 'PHS société', breadcrumb: 'PHS' },
  },
  {
    path: 'hse/visites-medicales',
    loadComponent: () =>
      import('../pages/hse/visites-medicales/visites-medicales-listing.page').then(
        (m) => m.VisitesMedicalesListingPage,
      ),
    data: { title: 'Visites médicales', breadcrumb: 'Visites médicales' },
  },
  {
    path: 'hse/registres-legaux',
    loadComponent: () =>
      import('../pages/hse/registres-legaux/registres-legaux.page').then(
        (m) => m.RegistresLegauxPage,
      ),
    data: { title: 'Registres légaux', breadcrumb: 'Registres légaux' },
  },
];

function mirrorQualiteRoutes(routes: Routes): Routes {
  const extra: Routes = [];
  for (const route of routes) {
    if (!route.path?.startsWith('hse')) continue;
    const copy = { ...route, path: route.path.replace(/^hse/, 'qualite') } as Routes[number];
    if (typeof route.redirectTo === 'string') {
      copy.redirectTo = route.redirectTo.replace(/^hse/, 'qualite');
    }
    extra.push(copy);
  }
  return [...routes, ...extra];
}

export const HSE_ROUTES: Routes = mirrorQualiteRoutes(HSE_BASE_ROUTES);
