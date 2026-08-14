import { Routes } from '@angular/router';

export const PILOTAGE_ROUTES: Routes = [
  {
    path: 'pilotage',
    pathMatch: 'full',
    redirectTo: 'pilotage/marges-chantier',
  },
  {
    path: 'pilotage/marges-chantier',
    loadComponent: () =>
      import('../pages/pilotage/marges-chantier/marges-chantier.page').then(m => m.MargesChantierPage),
    data: { title: 'dashboard.margesChantier.routeTitle', breadcrumb: 'dashboard.margesChantier.routeBreadcrumb' },
  },
  {
    path: 'pilotage/marge-consolidee',
    loadComponent: () =>
      import('../pages/pilotage/marge-consolidee/marge-consolidee.page').then(m => m.MargeConsolideePage),
    data: { title: 'dashboard.margeConsolidee.routeTitle', breadcrumb: 'dashboard.margeConsolidee.routeBreadcrumb' },
  },
  {
    path: 'pilotage/cash-flow',
    loadComponent: () =>
      import('../pages/pilotage/cash-flow/cash-flow.page').then(m => m.CashFlowPage),
    data: { title: 'dashboard.cashFlow.routeTitle', breadcrumb: 'dashboard.cashFlow.routeBreadcrumb' },
  },
  {
    path: 'pilotage-analyses',
    pathMatch: 'full',
    redirectTo: 'pilotage-analyses/rentabilite',
  },
  {
    path: 'pilotage-analyses/rentabilite',
    loadComponent: () =>
      import('../pages/pilotage-analyses/rentabilite/rentabilite-analyses.page').then(
        (m) => m.RentabiliteAnalysesPage,
      ),
    data: { title: 'dashboard.analyses.rentabilite.routeTitle', breadcrumb: 'dashboard.analyses.rentabilite.routeBreadcrumb' },
  },
  {
    path: 'pilotage-analyses/financier',
    loadComponent: () =>
      import('../pages/pilotage-analyses/financier/financier-analyses.page').then(
        (m) => m.FinancierAnalysesPage,
      ),
    data: { title: 'dashboard.analyses.financier.routeTitle', breadcrumb: 'dashboard.analyses.financier.routeBreadcrumb' },
  },
  {
    path: 'pilotage-analyses/stock',
    loadComponent: () =>
      import('../pages/pilotage-analyses/stock/stock-analyses.page').then((m) => m.StockAnalysesPage),
    data: { title: 'dashboard.analyses.stock.routeTitle', breadcrumb: 'dashboard.analyses.stock.routeBreadcrumb' },
  },
  {
    path: 'pilotage-analyses/achats',
    loadComponent: () =>
      import('../pages/pilotage-analyses/achats/achats-analyses.page').then((m) => m.AchatsAnalysesPage),
    data: { title: 'dashboard.analyses.achats.routeTitle', breadcrumb: 'dashboard.analyses.achats.routeBreadcrumb' },
  },
  {
    path: 'pilotage-analyses/rh',
    loadComponent: () =>
      import('../pages/pilotage-analyses/rh/rh-analyses.page').then((m) => m.RhAnalysesPage),
    data: { title: 'dashboard.analyses.rh.routeTitle', breadcrumb: 'dashboard.analyses.rh.routeBreadcrumb' },
  },
  {
    path: 'pilotage-analyses/what-if',
    loadComponent: () =>
      import('../pages/pilotage-analyses/what-if/what-if-analyses.page').then((m) => m.WhatIfAnalysesPage),
    data: { title: 'dashboard.analyses.whatIf.routeTitle', breadcrumb: 'dashboard.analyses.whatIf.routeBreadcrumb' },
  },
  {
    path: 'pilotage-analyses/opex-capex',
    loadComponent: () =>
      import('../pages/pilotage-analyses/opex-capex/opex-capex-analyses.page').then(
        (m) => m.OpexCapexAnalysesPage,
      ),
    data: { title: 'dashboard.analyses.opexCapex.routeTitle', breadcrumb: 'dashboard.analyses.opexCapex.routeBreadcrumb' },
  },
  {
    path: 'pilotage-analyses/groupe',
    loadComponent: () =>
      import('../pages/pilotage-analyses/groupe/groupe-analyses.page').then((m) => m.GroupeAnalysesPage),
    data: { title: 'dashboard.analyses.groupe.routeTitle', breadcrumb: 'dashboard.analyses.groupe.routeBreadcrumb' },
  },
];
