# Module Finance & Comptabilité — Brief Module

> Comptabilité (CGNC marocain), trésorerie, configuration financière. ~10% existe déjà (currencies, exchange-rates, payment-terms générés).

## Routes nav

| Route | Sub-spec |
|-------|----------|
| `/finance/journaux` | [01-finance-comptabilite.md](01-finance-comptabilite.md) |
| `/finance/balance` | [01-finance-comptabilite.md](01-finance-comptabilite.md) |
| `/finance/analytique` | [01-finance-comptabilite.md](01-finance-comptabilite.md) |
| `/finance/factures-fournisseurs` | [01-finance-comptabilite.md](01-finance-comptabilite.md) |
| `/finance/caisses` | [02-finance-tresorerie.md](02-finance-tresorerie.md) |
| `/finance/virements` | [02-finance-tresorerie.md](02-finance-tresorerie.md) |
| `/finance/reglements` | [02-finance-tresorerie.md](02-finance-tresorerie.md) |
| `/finance/rapprochement` | [02-finance-tresorerie.md](02-finance-tresorerie.md) |
| `/finance/devises` | [03-finance-configuration.md](03-finance-configuration.md) |
| `/finance/taux-change` | [03-finance-configuration.md](03-finance-configuration.md) |
| `/finance/conditions-paiement` | [03-finance-configuration.md](03-finance-configuration.md) |
| `/finance/plans-comptables` | [03-finance-configuration.md](03-finance-configuration.md) |

## Découpage

- **01-finance-comptabilite** : journaux, balance, analytique, factures fournisseurs (saisie + paiement).
- **02-finance-tresorerie** : caisses, virements internes, règlements clients/fournisseurs, rapprochement bancaire.
- **03-finance-configuration** : devises, taux de change, conditions paiement, plan comptable (compléter le générique).

## Plan comptable cible

CGNC (Code Général de Normalisation Comptable Maroc) — voir détail dans [00-MOCK-DATA §Plan comptable](../00-MOCK-DATA-STRATEGY.md).

## Permissions

```
finance.ecriture.read|create|valider|annuler
finance.journal.read
finance.balance.read|exporter
finance.analytique.read
finance.factureFournisseur.read|create|valider|payer
finance.caisse.read|create|update
finance.virement.read|create|valider
finance.reglement.read|create|valider
finance.rapprochement.read|valider
finance.config.devise|tauxChange|conditionsPaiement|planComptable.*
```

## Routes module

```ts
// applications/erp/finance/finance.routes.ts
export const FINANCE_ROUTES: Routes = [
  { path: 'finance/journaux', loadChildren: () => import('../pages/finance/journaux/journaux.routes').then(m => m.JOURNAUX_ROUTES) },
  { path: 'finance/balance', loadComponent: () => import('../pages/finance/balance/balance.page').then(m => m.BalancePage) },
  { path: 'finance/analytique', loadComponent: () => import('../pages/finance/analytique/analytique.page').then(m => m.AnalytiquePage) },
  { path: 'finance/factures-fournisseurs', loadChildren: () => import('../pages/finance/factures-fournisseurs/ff.routes').then(m => m.FF_ROUTES) },
  { path: 'finance/caisses', loadChildren: () => import('../pages/finance/caisses/caisses.routes').then(m => m.CAISSES_ROUTES) },
  { path: 'finance/virements', loadChildren: () => import('../pages/finance/virements/virements.routes').then(m => m.VIREMENTS_ROUTES) },
  { path: 'finance/reglements', loadChildren: () => import('../pages/finance/reglements/reglements.routes').then(m => m.REGLEMENTS_ROUTES) },
  { path: 'finance/rapprochement', loadComponent: () => import('../pages/finance/rapprochement/rapprochement.page').then(m => m.RapprochementPage) },
  { path: 'finance/conditions-paiement', loadChildren: () => import('../pages/finance/conditions-paiement/conditions-paiement.routes').then(m => m.CONDITIONS_PAIEMENT_ROUTES) },
  { path: 'finance/plans-comptables', loadChildren: () => import('../pages/finance/plans-comptables/plan-comptable.routes').then(m => m.PLAN_COMPTABLE_ROUTES) },
  // /finance/devises et /finance/taux-change déjà branchés via erp.routes.generated.ts
];
```

## Volumétrie cible

- Plan comptable : 80-120 comptes répartis classes 1-7 CGNC.
- 200+ écritures réparties sur 6 mois.
- 30+ factures fournisseurs.
- 4 banques + 2 caisses.
- 50+ règlements (clients et fournisseurs).
- 3-5 rapprochements mensuels.

## DoD module

- [ ] 3 sub-specs livrées.
- [ ] Plan comptable BTP Maroc (CGNC) seed complet.
- [ ] Génération automatique d'écritures depuis : factures clients, factures fournisseurs, règlements, situations, paie.
- [ ] Balance qui équilibre toujours (D = C) — vérification `npm run typecheck` + smoke test.
- [ ] `finance.routes.ts` injecté dans `erp.routes.generated.ts`.
