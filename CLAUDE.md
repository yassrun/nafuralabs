# CLAUDE.md — NafuraLabs

Tu opères dans le monorepo **nafuralabs**. Les règles sont les **mêmes** que pour Cursor / tout agent.

## Lire en premier (ordre)

1. [`NAFURALABS.md`](NAFURALABS.md) — porte du workspace
2. [`raster/AGENTS.md`](raster/AGENTS.md) — travail, Plan et Session
3. [`nafura-platform/ops/AGENTS.md`](nafura-platform/ops/AGENTS.md) — Ops K8s
4. [`ARCHI_BLUEPRINT.md`](ARCHI_BLUEPRINT.md) — coupe du code (socle, BC, APIs)

## Rules Cursor (mêmes contraintes — à respecter aussi)

Ces fichiers sous `.cursor/rules/` sont `alwaysApply` pour Cursor ; **Claude doit les suivre** :

| Rule | Contenu |
|------|---------|
| `.cursor/rules/raster-work.mdc` | projets, lots, sous-lots, plans, Tasks et agents |
| `.cursor/rules/ux-canvas-wireframes.mdc` | Canvas UX ; preview = copie `canvases/` ; pas Figma SSOT |
| `.cursor/rules/cursor-qa-browser.mdc` | QA Mode B : `make mode-b`, preset `qa-local` + auto-login `qa@…`, pas Keycloak |
| `.cursor/rules/lab-mode-no-prod-data.mdc` | Lab métier : Liquibase clean, liberté refonte ; prod réelle = vitrines MBS/corpo only |

## Chemins critiques (rappel)

| Quoi | Où |
|------|-----|
| Plans / lots | `<projet>/raster-src/` (obligatoire) |
| Canvas UX (Git) | `…/lots/<lot-slug>/<sous-lot-slug>/ux/*.canvas.tsx` |
| Tickets / bugs | `…/lots/…/tasks/{ID}-{slug}.md` · Raster possède le frontmatter et les statuts |
| Métier | peer du produit (`sektor/`, …) — jamais dans `nafura-platform/` |
| Code qui tourne | `<projet>/sources/` (`backend/` · `web/` · …) — [`NAFURALABS.md`](NAFURALABS.md) § Intérieur |
| Coupe du code | [`ARCHI_BLUEPRINT.md`](ARCHI_BLUEPRINT.md) |
| Template PLAN | `raster/templates/00-PLAN.md` |

## Interdits rapides

- Recréer un second arbre de planification sous `docs/`
- Canvas SSOT sous `docs/ux/wireframes/`
- Métier BTP dans `platform/`
- Secrets commités ; `NAFURA_DEV_CURSOR_AUTH_ENABLED` hors local
- Travail Nafura hors Task sous `raster-src/` (voir `raster/AGENTS.md`)
- Migrations « soft » pour une prod métier inexistante — préférer schéma clean + re-seed (sauf vitrines MBS/corpo)

Sektor live :

- **Raster actif.** Les documents historiques hors dépôt restent des références, jamais une source de vérité.
- Archive : `…/lots/_archive/qa-local-auth-seed/` — auth QA unique + seed (`qa@nafuralabs.local` / `qa-local`)
- QA Mode B : `make -C nafura-platform/ops mode-b` · auto-login owner `qa@nafuralabs.local` · rôles opt-in `qa-token.sh magasinier` · rule `.cursor/rules/cursor-qa-browser.mdc`
- e2e : `sektor/e2e/` — par **projet**, pas par BC
- Les cas de QA manuelle sont sortis du dépôt (`Desktop/nafuralabs-archives/sektor-web-docs/qa/`) : ils redeviennent des **e2e**, pas des documents.
