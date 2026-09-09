# CLAUDE.md — NafuraLabs

Tu opères dans le monorepo **nafuralabs**. Les règles sont les **mêmes** que pour Cursor / tout agent.

**Raster et Pact sont en pause.** Ne pas les utiliser comme cadre de travail (pas de Tasks, pas de `t.mjs`, pas de lecture obligatoire de `ARCHI_BLUEPRINT.md`).

## Lire en premier (ordre)

1. [`NAFURALABS.md`](NAFURALABS.md) — porte du workspace
2. [`nafura-platform/ops/AGENTS.md`](nafura-platform/ops/AGENTS.md) — Ops K8s (si tu touches au cluster / Mode B)

## Rules Cursor (mêmes contraintes)

Ces fichiers sous `.cursor/rules/` sont `alwaysApply` pour Cursor ; **Claude doit les suivre** :

| Rule | Contenu |
|------|---------|
| `.cursor/rules/raster-work.mdc` | Raster / Pact **en pause** — coder dans `sources/` |
| `.cursor/rules/ux-canvas-wireframes.mdc` | Canvas UX avant écran majeur |
| `.cursor/rules/cursor-qa-browser.mdc` | QA Mode B : `make mode-b`, preset `qa-local` + auto-login `qa@…`, pas Keycloak |
| `.cursor/rules/lab-mode-no-prod-data.mdc` | Lab métier : Liquibase clean, liberté refonte ; prod réelle = vitrines MBS/corpo only |

## Chemins utiles

| Quoi | Où |
|------|-----|
| Métier | peer du produit (`sektor/`, …) — jamais dans `nafura-platform/` |
| Code qui tourne | `<projet>/sources/` (`backend/` · `web/` · …) |
| Preuves e2e | `<projet>/e2e/` |
| Ops K8s | `nafura-platform/ops/` |

## Interdits rapides

- Métier BTP dans `platform/`
- Secrets commités ; `NAFURA_DEV_CURSOR_AUTH_ENABLED` hors local
- Relancer Raster (`t.mjs`, inbox, lots, Tasks) ou Pact tant que la pause n’est pas levée
- Migrations « soft » pour une prod métier inexistante — préférer schéma clean + re-seed (sauf vitrines MBS/corpo)

Sektor live :

- QA Mode B : `make -C nafura-platform/ops mode-b` · auto-login owner `qa@nafuralabs.local` · rôles opt-in `qa-token.sh magasinier` · rule `.cursor/rules/cursor-qa-browser.mdc`
- e2e : `sektor/e2e/`
- Les cas de QA manuelle hors dépôt redeviennent des **e2e**, pas des documents.
