import { Routes } from '@angular/router';

export const FINANCE_ROUTES: Routes = [
  {
    path: 'finance',
    pathMatch: 'full',
    redirectTo: 'finance/journaux',
  },

  // ─── Comptabilité ──────────────────────────────────────────────────────────
  {
    path: 'finance/journaux',
    loadChildren: () =>
      import('./pages/journaux/journaux.routes').then(
        (m) => m.JOURNAUX_ROUTES,
      ),
  },
  {
    path: 'finance/balance',
    loadComponent: () =>
      import('./pages/balance/balance.page').then(
        (m) => m.BalancePage,
      ),
    data: { titleKey: 'finance.balance.routeTitle', breadcrumbKey: 'finance.balance.routeBreadcrumb' },
  },
  {
    path: 'finance/analytique',
    loadComponent: () =>
      import('./pages/analytique/analytique.page').then(
        (m) => m.AnalytiquePage,
      ),
    data: { titleKey: 'finance.analytique.entityName', breadcrumbKey: 'finance.analytique.entityName' },
  },
  {
    path: 'finance/factures-fournisseurs',
    loadChildren: () =>
      import('./pages/factures-fournisseurs/ff.routes').then(
        (m) => m.FF_ROUTES,
      ),
  },
  {
    path: 'finance/lettrage',
    loadComponent: () =>
      import('./pages/lettrage/lettrage.page').then((m) => m.LettragePage),
    data: { titleKey: 'finance.lettrage.entityName', breadcrumbKey: 'finance.lettrage.entityName' },
  },
  {
    path: 'finance/recouvrement',
    loadComponent: () =>
      import('./pages/recouvrement/recouvrement.page').then((m) => m.RecouvrementPage),
    data: { titleKey: 'finance.recouvrement.entityName', breadcrumbKey: 'finance.recouvrement.entityName' },
  },
  {
    path: 'finance/effets',
    loadComponent: () =>
      import('./pages/effets/effets-commerce.page').then((m) => m.EffetsCommercePage),
    data: { titleKey: 'finance.effets.routeTitle', breadcrumbKey: 'finance.effets.routeBreadcrumb' },
  },
  {
    path: 'finance/caisses-chantier',
    loadComponent: () =>
      import('./pages/caisses-chantier/caisses-chantier.page').then(
        (m) => m.CaissesChantierPage,
      ),
    data: { titleKey: 'finance.caissesChantier.entityName', breadcrumbKey: 'finance.caissesChantier.entityName' },
  },

  // ─── Trésorerie ────────────────────────────────────────────────────────────
  {
    path: 'finance/caisses',
    loadChildren: () =>
      import('./pages/caisses/caisses.routes').then(
        (m) => m.CAISSES_ROUTES,
      ),
  },
  {
    path: 'finance/virements',
    loadChildren: () =>
      import('./pages/virements/virements.routes').then(
        (m) => m.VIREMENTS_ROUTES,
      ),
  },
  {
    path: 'finance/reglements',
    loadChildren: () =>
      import('./pages/reglements/reglements.routes').then(
        (m) => m.REGLEMENTS_ROUTES,
      ),
  },
  {
    path: 'finance/rapprochement',
    loadChildren: () =>
      import('./pages/rapprochement/rapprochement.routes').then(
        (m) => m.RAPPROCHEMENT_ROUTES,
      ),
  },

  // ─── Configuration ─────────────────────────────────────────────────────────
  {
    path: 'finance/plans-comptables',
    loadChildren: () =>
      import('./pages/plans-comptables/plan-comptable.routes').then(
        (m) => m.PLAN_COMPTABLE_ROUTES,
      ),
  },
  {
    path: 'finance/devises',
    loadChildren: () =>
      import('./pages/devises/devises.routes').then(
        (m) => m.DEVISES_ROUTES,
      ),
  },
  {
    path: 'finance/taux-change',
    loadChildren: () =>
      import('./pages/taux-change/taux-change.routes').then(
        (m) => m.TAUX_CHANGE_ROUTES,
      ),
  },
  {
    path: 'finance/conditions-paiement',
    loadChildren: () =>
      import('./pages/conditions-paiement/conditions-paiement.routes').then(
        (m) => m.CONDITIONS_PAIEMENT_ROUTES,
      ),
  },
  {
    path: 'finance/declarations/retenue-source',
    loadComponent: () =>
      import('./pages/declarations/retenue-source/retenue-source.page').then(
        (m) => m.RetenueSourcePage,
      ),
    data: {
      titleKey: 'finance.declarations.retenueSource.routeTitle',
      breadcrumbKey: 'finance.declarations.retenueSource.routeBreadcrumb',
    },
  },
  {
    path: 'finance/declarations/simpl-is',
    loadComponent: () =>
      import('./pages/declarations/simpl-is.page').then(m => m.SimplIsPage),
    data: {
      titleKey: 'finance.declarations.simplIs.routeTitle',
      breadcrumbKey: 'finance.declarations.simplIs.routeBreadcrumb',
    },
  },
  {
    path: 'finance/declarations/etat-9421',
    loadComponent: () =>
      import('@app/features/rh/pages/paie/declarations/igr-etat-9421.page').then((m) => m.IgrEtat9421Page),
    data: {
      titleKey: 'nav.finance.etat9421',
      breadcrumbKey: 'finance.routes.declarationsCrumb',
    },
  },
  {
    path: 'finance/declarations/etat-1208',
    loadComponent: () =>
      import('@app/features/rh/pages/paie/declarations/etat-1208.page').then((m) => m.Etat1208Page),
    data: {
      titleKey: 'nav.finance.etat1208',
      breadcrumbKey: 'finance.routes.declarationsCrumb',
    },
  },
];
