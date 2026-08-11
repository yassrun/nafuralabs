# CLAUDE.md — NafuraLabs

Tu opères dans le monorepo **nafuralabs**. Les règles sont les **mêmes** que pour Cursor / tout agent.

## Lire en premier (ordre)

1. [`docs/AGENTS.md`](docs/AGENTS.md) — canon monorepo (archi, deploy, où mettre le code)
2. [`docs/specs/README.md`](docs/specs/README.md) — specs / epics (PLAN · PROGRESS · canvas UX)
3. [`raster/AGENTS.md`](raster/AGENTS.md) — orchestrateur backlog / sprint (tickets dans les produits)
4. Ops K8s : [`toolchain/ops/AGENTS.md`](toolchain/ops/AGENTS.md)

## Rules Cursor (mêmes contraintes — à respecter aussi)

Ces fichiers sous `.cursor/rules/` sont `alwaysApply` pour Cursor ; **Claude doit les suivre** :

| Rule | Contenu |
|------|---------|
| `.cursor/rules/specs-epics.mdc` | Specs → `docs/specs/epics/<slug>/` ; canvas SSOT → `epics/<slug>/ux/` ; bugs → `raster/` |
| `.cursor/rules/ux-canvas-wireframes.mdc` | Canvas UX ; preview = copie `canvases/` ; pas Figma SSOT |
| `.cursor/rules/cursor-qa-browser.mdc` | QA Mode B : auth Cursor, `127.0.0.1:4200`, pas Keycloak |
| `.cursor/rules/lab-mode-no-prod-data.mdc` | Lab métier : Liquibase clean, liberté refonte ; prod réelle = vitrines MBS/corpo only |

## Chemins critiques (rappel)

| Quoi | Où |
|------|-----|
| Specs / epics | `products/<app>/docs/specs/epics/<feature-slug>/` |
| Canvas UX (Git) | `…/epics/<slug>/ux/*.canvas.tsx` |
| Tickets / bugs | `products/<app>/docs/specs/epics/<slug>/tasks/` · Raster = INDEX/Sprint seulement |
| Métier | `products/<app>/` — jamais dans `platform/` |
| Templates PLAN/PROGRESS | `docs/specs/templates/` |

## Interdits rapides

- Specs sous l’ancien `docs/epics/`
- Canvas SSOT sous `docs/ux/wireframes/`
- Métier BTP dans `platform/`
- Secrets commités ; `NAFURA_DEV_CURSOR_AUTH_ENABLED` hors local
- Travail Nafura hors ticket `raster/` + `sprint:` (voir `raster/AGENTS.md`)
- Migrations « soft » pour une prod métier inexistante — préférer schéma clean + re-seed (sauf vitrines MBS/corpo)

Sektor live :

- Epics (actifs) : `products/sektor-btp/docs/specs/epics/document-reader/`, `…/chiffrage-assiste-cps/`
- Epic (archivé) : `products/sektor-btp/docs/specs/epics/_archive/qa-local-auth-seed/` — auth QA unique + seed (`qa@nafuralabs.local` / `qa-local`)
- QA Mode B : `npm run start:erp:cursor` · `eval "$(bash toolchain/ops/qa-token.sh)"` · rule `.cursor/rules/cursor-qa-browser.mdc`
- QA manuelle / cas : `products/sektor-btp/web/docs/qa/` · e2e : `products/sektor-btp/web/tests/e2e/`
