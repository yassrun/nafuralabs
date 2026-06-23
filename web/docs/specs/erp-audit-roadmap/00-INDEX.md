# ERP Audit Roadmap — Tasks for Agents

> Source : audit UX/fonctionnel daté **2026-05-09** (`web/audit_claude.md`) + analyse codebase.
> Périmètre : ERP BTP Maroc (`web/app/applications/erp/`) — 13 modules sidebar.
> Objectif : ERP **vendable au Maroc** sous 12 semaines. Chaque tâche est self-contained.

## Comment lire ce dossier

1. **Lire `00-PRIORITIES.md`** pour comprendre les sprints suggérés et l'ordre d'attaque.
2. Choisir un fichier de tâche (`01-*.md` à `15-*.md`).
3. Chaque fichier suit le format :
   - `## Findings` (refs `F-XX` du document audit)
   - `## Goal`
   - `## Context to read first` (paths à lire avant de coder)
   - `## Tasks` (liste numérotée, chaque tâche a fichiers à modifier + acceptance criteria)
   - `## Testing` (tests e2e/unit à ajouter)
   - `## Dependencies` (autres tâches qui doivent être finies avant)
4. Marquer la case `[x]` quand la tâche est mergée.
5. Pour chaque tâche compléxe, scinder en sous-tâches via `TodoWrite`.

## Mapping F-XX → fichier de tâche

| ✓ | F-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [x] | F-01 Détail chantier introuvable | P0 | [02-chantiers-bugs.md](02-chantiers-bugs.md) |
| [~] | F-02 Lignes liste non cliquables | P0 | [02-chantiers-bugs.md](02-chantiers-bugs.md) |
| [x] | F-03 Currency `$` au lieu MAD | P0 | [01-foundations.md](01-foundations.md) |
| [~] | F-04 3 formats codes chantiers | P0 | [01-foundations.md](01-foundations.md) |
| [x] | F-05 Routes ST / documents | P0 | [02-chantiers-bugs.md](02-chantiers-bugs.md) |
| [x] | F-06 Clés i18n `inventory.materiel.*` | P0 | [01-foundations.md](01-foundations.md) |
| [~] | F-07 Module Stock absent | P0 | [05-stock-module.md](05-stock-module.md) |
| [x] | F-08 Module Marchés absent | P0 | [06-marches-facturation.md](06-marches-facturation.md) |
| [~] | F-09 Pilotage / Admin / HSE / Approbations | P0 | [07-pilotage-approbations.md](07-pilotage-approbations.md), [08-administration.md](08-administration.md), [09-hse-module.md](09-hse-module.md) |
| [~] | F-10 Breadcrumb absent/erroné | P1 | [03-shell-ux.md](03-shell-ux.md) |
| [x] | F-11 Recherche globale Ctrl+K | P1 | [03-shell-ux.md](03-shell-ux.md) |
| [x] | F-12 Notifications panel | P1 | [03-shell-ux.md](03-shell-ux.md) |
| [~] | F-13 Toggle langue | P1 | [03-shell-ux.md](03-shell-ux.md) |
| [x] | F-14 `<html lang="en">` | P1 | [01-foundations.md](01-foundations.md) |
| [~] | F-15 Boutons création hétérogènes | P1 | [03-shell-ux.md](03-shell-ux.md), [11-design-system.md](11-design-system.md) |
| [x] | F-16 Formats nombres incohérents | P1 | [01-foundations.md](01-foundations.md) |
| [x] | F-17 Retenues paie sous-calculées | P1 | [10-paie-fiscal-maroc.md](10-paie-fiscal-maroc.md) |
| [x] | F-18 Panneau IA toujours ouvert | P1 | [03-shell-ux.md](03-shell-ux.md) |
| [~] | F-19 Pas de virtualisation | P1 | [04-tables-forms-states.md](04-tables-forms-states.md) |
| [x] | F-20 Pas de feedback toast | P1 | [04-tables-forms-states.md](04-tables-forms-states.md) |
| [x] | F-21 Pas de CanDeactivate | P1 | [04-tables-forms-states.md](04-tables-forms-states.md) |
| [~] | F-22 États loading/empty/error | P1 | [04-tables-forms-states.md](04-tables-forms-states.md) |
| [~] | F-23 Filtres mobile non scrollables | P1 | [04-tables-forms-states.md](04-tables-forms-states.md) |
| [~] | F-24 Spécificités fiscales MA | P1 | [10-paie-fiscal-maroc.md](10-paie-fiscal-maroc.md) |
| [x] | F-25 Accents manquants planning | P2 | [01-foundations.md](01-foundations.md) |
| [ ] | F-26 Hiérarchie typographique | P2 | [11-design-system.md](11-design-system.md) |
| [~] | F-27 Pas d'export CSV/XLSX/PDF | P2 | [12-exports-impressions.md](12-exports-impressions.md) |
| [~] | F-28 Pas de templates impression | P2 | [12-exports-impressions.md](12-exports-impressions.md) |
| [x] | F-29 Pas d'audit log | P2 | [14-tests-audit.md](14-tests-audit.md) |
| [x] | F-30 Statuts couleurs incohérents | P2 | [11-design-system.md](11-design-system.md) |
| [x] | F-31 Dashboard KPI faux | P2 | [01-foundations.md](01-foundations.md) |
| [~] | F-32 RH pointage chantier | P2 | [13-rh-terrain.md](13-rh-terrain.md) |
| [~] | F-33 Formulaires non audités | P2 | [04-tables-forms-states.md](04-tables-forms-states.md) |
| [x] | F-34 Workflow Approbations | P2 | [07-pilotage-approbations.md](07-pilotage-approbations.md) |
| [x] | F-35 Clé `core.ai.assistant.title` | P2 | [01-foundations.md](01-foundations.md) |
| [~] | F-36 → F-42 (P3 polish) | P3 | [15-polish.md](15-polish.md) |

> **Légende** : `[x]` = résolu · `[~]` = partiel · `[ ]` = à faire
> **Compteur Findings** : 18 ✅ résolus / 16 🟡 partiels / 2 ❌ à faire (sur 36 numérotés)

## Dépendances entre tâches (graph d'attaque)

```
01-foundations  ─┬─►  02-chantiers-bugs ─►  04-tables-forms-states
                 ├─►  03-shell-ux
                 ├─►  05-stock-module ────►  06-marches-facturation
                 ├─►  07-pilotage-approbations  ─►  08-administration
                 ├─►  09-hse-module
                 ├─►  10-paie-fiscal-maroc
                 └─►  11-design-system    ─►  12-exports-impressions
                                          ─►  13-rh-terrain
                                          ─►  14-tests-audit
                                          ─►  15-polish
```

**Règle** : `01-foundations` doit être terminé en premier — il fixe currency, locale, mock unifié, i18n. Tout le reste construit dessus.

## Trouvailles techniques (analyse codebase)

Pendant l'analyse du code, j'ai identifié ces causes-racines à intégrer dans les tâches :

| Cause-racine | Localisation | Impact | Tâche |
|---|---|---|---|
| `\| currency` Angular pipe sans locale | `app/platform/lib/anatomy/components/organisms/data-table/data-table.component.ts:157,186` | Affiche `$` car `LOCALE_ID` non défini → défaut `en-US` USD | F-03 → 01-foundations |
| Aucun `LOCALE_ID` provider | `app/app.config.ts` | Pipes dates/currency en `en-US` | F-03, F-14, F-16 → 01-foundations |
| `chantier-detail-placeholder.page.ts` est un placeholder | `app/applications/erp/pages/chantiers/detail/` | Nom + intent : ce n'est PAS la vraie fiche détail. À remplacer | F-01 → 02-chantiers-bugs |
| Mock `ChantiersMockService.getChantierById()` retourne undefined si l'id ne match aucun chantier seedé | Le seed contient `CH-2026-001..006` mais la liste utilise différents codes selon les modules | F-01, F-04 → 01, 02 |
| Pas d'`exactMatch` propagé dans tous les nav (chantiers fixé) | `erp-nav.generated.ts` | Multiples menus restent actifs | Patch ponctuel selon F-XX |
| `data-table.component.ts` utilise `| currency` partout (lignes 157, 186) | Idem | F-03 cause technique |

## État actuel (snapshot 2026-05-09)

Voir [00-PRIORITIES.md](00-PRIORITIES.md) pour la planification sprint par sprint.

— Audit folder créé pour : `feat/erp-chantiers-situations` branch.

## 📊 Tableau de progression (mis à jour 2026-05-10)

> Auditer tous les `Tasks` numérotés et coller ici le statut réel observé dans le code.
> Mise à jour automatique : voir `00-PROGRESS.md` pour le détail tâche par tâche.

| Spec | ✅ FAIT | 🟡 PARTIEL | ❌ MANQUANT | Avancement |
|---|---|---|---|---|
| [01-foundations](01-foundations.md) | 8 | 1 | 0 | 🟢 100% |
| [02-chantiers-bugs](02-chantiers-bugs.md) | 3 | 1 | 0 | 🟢 88% |
| [03-shell-ux](03-shell-ux.md) | 3 | 3 | 0 | 🟡 75% |
| [04-tables-forms-states](04-tables-forms-states.md) | 4 | 3 | 0 | 🟡 64% |
| [05-stock-module](05-stock-module.md) | 4 | 2 | 1 | 🟡 71% |
| [06-marches-facturation](06-marches-facturation.md) | 7 | 1 | 0 | 🟢 94% |
| [07-pilotage-approbations](07-pilotage-approbations.md) | 3 | 5 | 0 | 🟡 75% |
| [08-administration](08-administration.md) | 4 | 2 | 1 | 🟡 71% |
| [09-hse-module](09-hse-module.md) | 4 | 2 | 0 | 🟡 67% |
| [10-paie-fiscal-maroc](10-paie-fiscal-maroc.md) | 3 | 4 | 0 | 🟢 75% |
| [11-design-system](11-design-system.md) | 1 | 0 | 2 | 🔴 33% |
| [12-exports-impressions](12-exports-impressions.md) | 2 | 2 | 1 | 🟡 60% |
| [13-rh-terrain](13-rh-terrain.md) | 1 | 5 | 0 | 🟡 58% |
| [14-tests-audit](14-tests-audit.md) | 2 | 1 | 5 | 🟡 31% |
| [15-polish](15-polish.md) | 4 | 6 | 0 | 🟡 70% |
| **TOTAL** | **51** | **38** | **11** | **~68%** |

🟢 ≥80% · 🟡 40–79% · 🔴 <40%
