# Planning — activités

> Couche d'activités (palier 2). Contrat [`CONTRAT.md`](CONTRAT.md). Gels § planning / WBS / avancement.
> Mode vague 2 : **1 agent exec** sur le sous-lot · **pas de QA** Raster.

## Tasks

| # | Task | blocked_by |
|---|------|------------|
| — | SEKTOR-175 CONTRAT (blocked — remplacé par CONTRAT.md) | — |
| 1 | SEKTOR-176 Domaine + API activités | — |
| 2 | SEKTOR-177 Avancement activité → remontée nœud + couverture | 176 |
| 3 | SEKTOR-178 Front Gantt activités (remplace coquille phases) | 176, 177 |
| 4 | SEKTOR-179 Workspace Gantt — créer / éditer dans le drawer | 178 |
| 5 | SEKTOR-180 Drawer rattachement picker + avancement + e2e chantier planifié | 179 |

Canvas : [`ux/planning-workspace-wireframe.canvas.tsx`](ux/planning-workspace-wireframe.canvas.tsx).

## Preuves Mode B (28/08/2026)

- `sektor/e2e/scripts/verify-planning-activites-20260825.mjs` — **PASS** (176/177)
- `sektor/e2e/scripts/verify-planning-chantier-planifie-20260825.mjs` — **PASS** API (179/180) · Playwright skip (binaire absent)
- SEKTOR-184 : grep `chantier-detail.page.ts` sans onglet `phases` — **PASS**

## Hors sous-lot

Capacité / engagement / baseline / pointage / magasin → autres dossiers vague 2.
