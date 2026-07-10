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
      import('../pages/finance/journaux/journaux.routes').then(
        (m) => m.JOURNAUX_ROUTES,
      ),
  },
  {
    path: 'finance/balance',
    loadComponent: () =>
      import('../pages/finance/balance/balance.page').then(
        (m) => m.BalancePage,
      ),
    data: { titleKey: 'finance.balance.routeTitle', breadcrumbKey: 'finance.balance.routeBreadcrumb' },
  },
  {
    path: 'finance/analytique',
    loadComponent: () =>
      import('../pages/finance/analytique/analytique.page').then(
        (m) => m.AnalytiquePage,
      ),
    data: { titleKey: 'finance.analytique.entityName', breadcrumbKey: 'finance.analytique.entityName' },
  },
  {
    path: 'finance/factures-fournisseurs',
    loadChildren: () =>
      import('../pages/finance/factures-fournisseurs/ff.routes').then(
        (m) => m.FF_ROUTES,
      ),
  },
  {
    path: 'finance/lettrage',
    loadComponent: () =>
      import('../pages/finance/lettrage/lettrage.page').then((m) => m.LettragePage),
    data: { titleKey: 'finance.lettrage.entityName', breadcrumbKey: 'finance.lettrage.entityName' },
  },
  {
    path: 'finance/recouvrement',
    loadComponent: () =>
      import('../pages/finance/recouvrement/recouvrement.page').then((m) => m.RecouvrementPage),
    data: { titleKey: 'finance.recouvrement.entityName', breadcrumbKey: 'finance.recouvrement.entityName' },
  },
  {
    path: 'finance/effets',
    loadComponent: () =>
      import('../pages/finance/effets/effets-commerce.page').then((m) => m.EffetsCommercePage),
    data: { titleKey: 'finance.effets.routeTitle', breadcrumbKey: 'finance.effets.routeBreadcrumb' },
  },
  {
    path: 'finance/caisses-chantier',
    loadComponent: () =>
      import('../pages/finance/caisses-chantier/caisses-chantier.page').then(
        (m) => m.CaissesChantierPage,
      ),
    data: { titleKey: 'finance.caissesChantier.entityName', breadcrumbKey: 'finance.caissesChantier.entityName' },
  },

  // ─── Trésorerie ────────────────────────────────────────────────────────────
  {
    path: 'finance/caisses',
    loadChildren: () =>
      import('../pages/finance/caisses/caisses.routes').then(
        (m) => m.CAISSES_ROUTES,
      ),
  },
  {
    path: 'finance/virements',
    loadChildren: () =>
      import('../pages/finance/virements/virements.routes').then(
        (m) => m.VIREMENTS_ROUTES,
      ),
  },
  {
    path: 'finance/reglements',
    loadChildren: () =>
      import('../pages/finance/reglements/reglements.routes').then(
        (m) => m.REGLEMENTS_ROUTES,
      ),
  },
  {
    path: 'finance/rapprochement',
    loadChildren: () =>
      import('../pages/finance/rapprochement/rapprochement.routes').then(
        (m) => m.RAPPROCHEMENT_ROUTES,
      ),
  },

  // ─── Configuration ─────────────────────────────────────────────────────────
  {
    path: 'finance/plans-comptables',
    loadChildren: () =>
      import('../pages/finance/plans-comptables/plan-comptable.routes').then(
        (m) => m.PLAN_COMPTABLE_ROUTES,
      ),
  },
  {
    path: 'finance/devises',
    loadChildren: () =>
      import('../pages/finance/devises/devises.routes').then(
        (m) => m.DEVISES_ROUTES,
      ),
  },
  {
    path: 'finance/taux-change',
    loadChildren: () =>
      import('../pages/finance/taux-change/taux-change.routes').then(
        (m) => m.TAUX_CHANGE_ROUTES,
      ),
  },
  {
    path: 'finance/conditions-paiement',
    loadChildren: () =>
      import('../pages/finance/conditions-paiement/conditions-paiement.routes').then(
        (m) => m.CONDITIONS_PAIEMENT_ROUTES,
      ),
  },
  {
    path: 'finance/declarations/retenue-source',
    loadComponent: () =>
      import('../pages/finance/declarations/retenue-source/retenue-source.page').then(
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
      import('../pages/finance/declarations/simpl-is.page').then(m => m.SimplIsPage),
    data: {
      titleKey: 'finance.declarations.simplIs.routeTitle',
      breadcrumbKey: 'finance.declarations.simplIs.routeBreadcrumb',
    },
  },
  {
    path: 'finance/declarations/etat-9421',
    loadComponent: () =>
      import('../pages/rh/paie/declarations/igr-etat-9421.page').then((m) => m.IgrEtat9421Page),
    data: {
      titleKey: 'nav.finance.etat9421',
      breadcrumbKey: 'finance.routes.declarationsCrumb',
    },
  },
  {
    path: 'finance/declarations/etat-1208',
    loadComponent: () =>
      import('../pages/rh/paie/declarations/etat-1208.page').then((m) => m.Etat1208Page),
    data: {
      titleKey: 'nav.finance.etat1208',
      breadcrumbKey: 'finance.routes.declarationsCrumb',
    },
  },
];
