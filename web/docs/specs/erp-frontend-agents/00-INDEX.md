# ERP Frontend Agents — Index

> Pack de specs pour finaliser le frontend ERP Nafura (BTP Maroc).
> Source de vérité nav : `web/app/applications/erp/shell/erp-nav.generated.ts`.
> Module pilote : `web/app/applications/erp/pages/inventory/` (~70% complet, sert de référence pattern).

## Mission

Délivrer en mode **mock-first** un ERP BTP Maroc **concurrentiel** (vs Sage BTP, Onaya, BatiPilot, Optim BTP) sur un socle Angular 19 / config-driven déjà en place. Chaque agent prend **un brief** et scaffolde un module ou une sous-section autonome, sans backend (mocks via service local par feature).

## Conventions communes (lecture obligatoire avant tout agent)

1. [00-CONVENTIONS.md](00-CONVENTIONS.md) — pattern technique : structure folder, `@lib/anatomy`, listing/detail config-driven, routes lazy, conventions de naming.
2. [00-MOCK-DATA-STRATEGY.md](00-MOCK-DATA-STRATEGY.md) — stratégie de mocks, jeu de données BTP Maroc (sociétés, ICE, RC, chantiers, articles, fournisseurs réalistes), volumétrie cible.
3. [00-UX-PRINCIPES.md](00-UX-PRINCIPES.md) — principes UX BTP : densité, statuts, workflows, écrans non-tabulaires (gantt, kanban, calendar, map), i18n FR.

## Agents (1 spec = 1 dossier ou 1 fichier)

### Zone `work` — Pilotage temps réel

| ID | Brief | Nav cible | État actuel |
|----|-------|-----------|-------------|
| 01 | [01-dashboard.md](01-dashboard.md) | `/dashboard` | 0% |

### Zone `operations` — Exécution chantier

| ID | Brief | Nav cible | État actuel |
|----|-------|-----------|-------------|
| 02 | [02-chantiers/](02-chantiers/) (7 sub-specs) | `/chantiers/*` | 0% |
| 03 | [03-achats.md](03-achats.md) | `/achats/*` | 0% |
| 04 | [04-stock-refinement.md](04-stock-refinement.md) | `/inventory/*` | 70% — refinement |
| 05 | [05-materiel.md](05-materiel.md) | `/materiel/*` | 30% |

### Zone `business` — Cycle commercial & financier

| ID | Brief | Nav cible | État actuel |
|----|-------|-----------|-------------|
| 06 | [06-etudes.md](06-etudes.md) | `/etudes/*` | 0% |
| 07 | [07-ventes/](07-ventes/) (3 sub-specs) | `/ventes/*` | 0% |
| 08 | [08-finance/](08-finance/) (3 sub-specs) | `/finance/*` | 10% |

### Zone `people` — Capital humain & sécurité

| ID | Brief | Nav cible | État actuel |
|----|-------|-----------|-------------|
| 09 | [09-rh/](09-rh/) (4 sub-specs) | `/rh/*` | 0% |
| 10 | [10-hse.md](10-hse.md) | `/hse/*` | 0% |

### Zone `pilotage` — Décisionnel

| ID | Brief | Nav cible | État actuel |
|----|-------|-----------|-------------|
| 11 | [11-analytics.md](11-analytics.md) | `/analytics/*` | 0% |

## Ordre d'exécution recommandé

**Vague 1 — fondations métier BTP** (parallélisable, 4 agents)
- 02-chantiers/01-liste — l'objet pivot ERP BTP
- 03-achats — branche cycle d'engagement
- 06-etudes — chiffrage amont
- 05-materiel — refinement parc engins

**Vague 2 — cycles financiers** (dépend de chantiers + achats)
- 07-ventes/* — facturation client (utilise chantiers)
- 08-finance/01-comptabilite — reçoit factures fournisseurs (lien achats) + factures clients (lien ventes)
- 04-stock-refinement — comble les gaps

**Vague 3 — people + analytics** (parallélisable)
- 09-rh/* — pointage rattaché aux chantiers
- 10-hse — incidents rattachés aux chantiers
- 01-dashboard — agrège tout
- 11-analytics — dashboards métier

**Vague 4 — finitions** (après vague 1-3)
- 02-chantiers/02..07 — planning gantt, situations de travaux, budget, sous-traitance, documents

## DoD globale (tout brief)

Un brief est livré quand :

- [ ] Routes lazy déclarées dans `<module>.routes.ts` et alignées avec `erp-nav.generated.ts`.
- [ ] Pages standalone Angular 19 (signals, OnPush implicite via standalone).
- [ ] Listings utilisent `ConfigDrivenListingPage` + `buildListingConfig` (pattern articles).
- [ ] Détails utilisent `ConfigDrivenDetailPage` + `buildDetailConfig` (pattern reception-detail).
- [ ] Mock service local par feature (`<feature>-mock.service.ts`) avec ≥ 20 enregistrements réalistes BTP Maroc (ICE/RC/chantiers cohérents).
- [ ] Facade `<Entity>Facade extends GridFacade<T>` injectant le mock.
- [ ] i18n via clés `nav.<module>.*` et `<module>.fields.*` (placeholders FR-MA acceptés en V1).
- [ ] Permission prefix : `<domain>.<entity>.<action>` (ex: `chantiers.chantier.read`).
- [ ] Routes reliées dans `erp.routes.generated.ts` (ou route ERP custom dédiée si module nouveau hors NAF).
- [ ] Types à zéro (`any` proscrit hors `unknown` justifié).
- [ ] `npm run typecheck` vert sur le scope de l'agent.

## Références socle

- `@lib/anatomy` — `ConfigDrivenListingPage`, `ConfigDrivenDetailPage`, `buildListingConfig`, `buildDetailConfig`, `GridFacade`, types.
- Composants partagés : `web/app/applications/erp/inventory/components/` (réutilisables).
- Modèles partagés inventory : `web/app/applications/erp/inventory/models/index.ts`.
- Routes ERP : `web/app/applications/erp/routes/erp.routes.generated.ts` (généré) + `inventory.routes.ts` (custom hand-written, modèle à suivre pour les modules non générés).
- Nav source : `web/app/applications/erp/shell/erp-nav.generated.ts`.

## Convention de nommage

- Module = nom de zone nav (ex: `chantiers`, `achats`, `etudes`).
- Pages : `pages/<module>/<sous-section>/<entity>/`.
- Routes : alignées avec la nav exacte (`/chantiers/planning`, pas `/chantiers/gantt`).
- Permissions : `<module>.<entity>.<action>` (read|create|update|delete|<custom>).
