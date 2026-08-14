---

id: PLT-30
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-24]
---

# venue-catalog · corporate · mbs-studio · raster web

## Étapes

- [x] `products/venue-catalog` → `venue-catalog/` (+ `deploy/` → `ops/`)
- [x] `marketing/corporate` → `corporate/`
- [x] `marketing/products/mbs-studio` → `mbs-studio/`
- [x] `products/raster/web` → `raster/web/` — supprime le dernier doublon du moteur
- [x] Chemins `nlops.sh` pour chacun

## Preuve de fin

Chaque site build et se déploie.

## Journal

```
13/08 23:33  tsk1  git mv products/venue-catalog → venue-catalog/ ; deploy/k8s → ops/k8s
13/08 23:33  tsk2  marketing/corporate → corporate/
13/08 23:33  tsk3  marketing/products/mbs-studio → mbs-studio/
13/08 23:33  tsk4  products/raster/web → raster/web/ (git mv fichier par fichier ; dir source busy)
13/08 23:34  tsk5  nlops : marketing_app_root, app_deploy_dir venue, docker/npm venue. settings.gradle venue projectDir (nécessaire au bootJar). workspaces + Dockerfiles + tsconfig.
13/08 23:36  preuve  corporate npm run build VERT. mbs-studio VERT (WARN img comme lot 0). venue-catalog web VERT. Overlays kustomize staging venue/mbs + prod corporate.

Livré : venue-catalog/ · corporate/ · mbs-studio/ · raster/web/
```
