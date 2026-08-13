# CLAUDE.md — NafuraLabs

Tu opères dans le monorepo **nafuralabs**. Les règles sont les **mêmes** que pour Cursor / tout agent.

## Lire en premier (ordre)

1. [`docs/AGENTS.md`](docs/AGENTS.md) — canon monorepo (archi, deploy, où mettre le code)
3. [`raster/AGENTS.md`](raster/AGENTS.md) — orchestrateur backlog / sprint (tickets dans les produits)
4. Ops K8s : [`toolchain/ops/AGENTS.md`](toolchain/ops/AGENTS.md)

## Rules Cursor (mêmes contraintes — à respecter aussi)

Ces fichiers sous `.cursor/rules/` sont `alwaysApply` pour Cursor ; **Claude doit les suivre** :

| Rule | Contenu |
|------|---------|
| `.cursor/rules/specs-epics.mdc` | `<projet>/raster-src/` ; Pact si app/site ; `raster/` = projet |
| `.cursor/rules/ux-canvas-wireframes.mdc` | Canvas UX ; preview = copie `canvases/` ; pas Figma SSOT |
| `.cursor/rules/cursor-qa-browser.mdc` | QA Mode B : auth Cursor, `127.0.0.1:4200`, pas Keycloak |
| `.cursor/rules/lab-mode-no-prod-data.mdc` | Lab métier : Liquibase clean, liberté refonte ; prod réelle = vitrines MBS/corpo only |

## Chemins critiques (rappel)

| Quoi | Où |
|------|-----|
| Specs / lots | `<projet>/raster-src/` (obligatoire) · `<projet>/pact/` si app/site |
| Canvas UX (Git) | `…/lots/<lot-slug>/<sous-lot-slug>/ux/*.canvas.tsx` |
| Tickets / bugs | `…/lots/…/tasks/{ID}-{slug}.md` · Raster = INDEX/Sprint seulement |
| Métier | `products/<app>/` — jamais dans `platform/` |
| Template PLAN | `raster/templates/00-PLAN.md` |

## Interdits rapides

- Recréer `docs/specs/` — les specs vivent dans `<projet>/pact/`
- Specs sous l’ancien `docs/epics/`
- Canvas SSOT sous `docs/ux/wireframes/`
- Métier BTP dans `platform/`
- Secrets commités ; `NAFURA_DEV_CURSOR_AUTH_ENABLED` hors local
- Travail Nafura hors ticket `raster/` + `sprint:` (voir `raster/AGENTS.md`)
- Migrations « soft » pour une prod métier inexistante — préférer schéma clean + re-seed (sauf vitrines MBS/corpo)

Sektor live :

- **Pas encore pacté ni rasté.** L'ancien `docs/specs/lots/` est sorti du dépôt (`Desktop/nafuralabs-archives/sektor-btp-docs-specs/`) — référence seulement, jamais une source.
- Archive : `…/lots/_archive/qa-local-auth-seed/` — auth QA unique + seed (`qa@nafuralabs.local` / `qa-local`)
- QA Mode B : `npm run start:erp:cursor` · `eval "$(bash toolchain/ops/qa-token.sh)"` · rule `.cursor/rules/cursor-qa-browser.mdc`
- e2e : `products/sektor-btp/web/tests/e2e/` — à déplacer vers `sektor/e2e/` (par **projet**) quand Sektor sera pacté.
- Les cas de QA manuelle sont sortis du dépôt (`Desktop/nafuralabs-archives/sektor-web-docs/qa/`) : ils redeviennent des **e2e**, pas des documents.
