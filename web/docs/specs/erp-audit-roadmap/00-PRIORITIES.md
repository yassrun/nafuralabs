# Priorités & Planning — Audit ERP

## Sévérités

- **P0 BLOQUANT** : crédibilité produit nulle ou démo cassée. Doit être fixé avant toute démo client.
- **P1 MAJEUR** : ralentit ou frustre l'utilisation pro mais l'ERP reste utilisable.
- **P2 MOYEN** : qualité produit, polish, conformité. Pas de blocage immédiat.
- **P3 MINEUR** : finition, dark mode, branding.

## Règle d'or

`01-foundations` (data, currency, locale, i18n) **EST UN PRÉREQUIS DE TOUT**. Aucune autre tâche P0/P1 ne peut être livrée proprement sans la couche fondation propre — sinon on multiplie les retours arrière.

## Sprints suggérés (12 semaines)

### S1–S2 — Fondations & cohérence
**Goal** : Base saine pour démos commerciales.

- ✅ [01-foundations.md](01-foundations.md) — currency MAD globale, locale `fr-MA`, mock chantiers unifié, i18n keys manquantes, `<html lang>` dynamique, KPI dashboard cohérents
- ✅ [02-chantiers-bugs.md](02-chantiers-bugs.md) — drill-down chantier (F-01, F-02), routes ST/documents (F-05)
- ✅ [11-design-system.md](11-design-system.md) (MVP) — `MoneyInput`, `IceInput`, `RibInput`, `PhoneMaInput`, `Toast`, `EmptyState`, `Skeleton`, `StatusBadge`

**Livrable démo** : navigation chantier sans bug, devises correctes, mock cohérent, design system embryonnaire.

### S3–S4 — Modules manquants critiques
**Goal** : combler les trous fonctionnels qui rendent l'ERP non vendable.

- ✅ [05-stock-module.md](05-stock-module.md) — référentiel + mouvements + valorisation
- ✅ [06-marches-facturation.md](06-marches-facturation.md) — contrats, avenants, factures situation, retenues, révision K
- ✅ [10-paie-fiscal-maroc.md](10-paie-fiscal-maroc.md) (partie fiscal tiers) — IF/RC/Patente/RIB sur tiers, retenue source 5%, TVA configurable

**Livrable démo** : démo qui couvre cycle complet contrat → BC → réception → situation → facture → paiement.

### S5–S6 — Pilotage & Approbations
**Goal** : Différenciation commerciale + gouvernance.

- ✅ [07-pilotage-approbations.md](07-pilotage-approbations.md) — Approbations workflow engine + Pilotage KPIs
- ✅ [03-shell-ux.md](03-shell-ux.md) — breadcrumb global, command palette Ctrl+K, notifications, toggle langue, panneau IA fermable, boutons création standardisés

**Livrable démo** : workflow validation BC/factures, dashboards consolidés, recherche globale.

### S7–S8 — HSE & RH terrain
**Goal** : Couverture conformité légale + différenciateur mobile.

- ✅ [09-hse-module.md](09-hse-module.md) — NC, incidents/AT, registres CNSS, audits chantier
- ✅ [13-rh-terrain.md](13-rh-terrain.md) — pointage chantier mobile (photo + géoloc + offline)
- ✅ [10-paie-fiscal-maroc.md](10-paie-fiscal-maroc.md) (partie paie) — moteur paie marocain (CNSS, AMO, IGR, CIMR, BAP, DAMANCOM)
- 🚀 Bilingue FR/AR + RTL (issue de [03-shell-ux.md](03-shell-ux.md))

### S9–S10 — Production-readiness
**Goal** : prêt pour pilote client.

- ✅ [08-administration.md](08-administration.md) — utilisateurs, rôles, sociétés multi-entité, paramètres
- ✅ [14-tests-audit.md](14-tests-audit.md) — audit log, e2e Playwright, couverture services calcul
- ✅ [12-exports-impressions.md](12-exports-impressions.md) — exports CSV/XLSX, impressions PDF (BC, factures, situations)
- ✅ [04-tables-forms-states.md](04-tables-forms-states.md) — virtualisation, CanDeactivate, états loading/empty/error

### S11–S12 — Polish & démo commerciale
**Goal** : pixel-perfect + onboarding.

- ✅ [11-design-system.md](11-design-system.md) (finalisation) — pass complet sur typo, espaces, contrastes
- ✅ [15-polish.md](15-polish.md) — tooltips, raccourcis, dark mode, PWA manifest, branding
- 🚀 Jeu de données démo « société modèle BTP Maroc » (Casablanca, 6 chantiers réalistes)
- 🚀 Onboarding tour interactif

## Anti-patterns à éviter

- ❌ **Touch & go** : ne pas patcher les symptômes (currency `$` corrigée page par page) — fixer la racine (locale + pipe MAD globaux).
- ❌ **Génération bulk** : ne pas regénérer un module entier avec un agent sans relire — auditer chaque batch.
- ❌ **Tests skip** : chaque tâche P0/P1 inclut son test e2e. Ne pas livrer sans.
- ❌ **i18n hardcoded** : aucun string FR ne doit être inline. Toujours via clé i18n.
- ❌ **Mock multiplié** : un seul mock chantiers (cf F-04). Tout module qui en a besoin l'importe.

## KPIs de progression

À tracker sprint par sprint :

| KPI | Source | Cible S6 | Cible S12 |
|---|---|---|---|
| Modules sidebar non-stub | comptage routes vs erp-nav | 11/13 | 13/13 |
| Findings F-XX résolus | check `[x]` dans `00-INDEX.md` | 25/42 | 42/42 |
| Couverture tests services | `npm run test:coverage` | ≥ 60% | ≥ 80% |
| Lighthouse perf | CI lighthouse | ≥ 70 | ≥ 90 |
| A11Y audit (axe-core) | CI axe-core | 0 violations critiques | 0 violations |
| Devise `$` détectée | grep en CI | 0 | 0 |
| Clés i18n manquantes | `MissingTranslationHandler` | 0 | 0 |
