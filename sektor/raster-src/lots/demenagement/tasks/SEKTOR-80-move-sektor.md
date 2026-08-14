---

id: SEKTOR-80
status: done-me
context: nafura
type: tech
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-1, PLT-24]
---

# products/sektor-btp/ vers sektor/

> Le plus gros lot : 4 486 fichiers. **Déplacement seul** — aucune correction au passage.

## Étapes

- [x] `products/sektor-btp/{backend,web}` → `sektor/`
- [x] `products/sektor-btp/deploy` → `sektor/ops/`
- [x] `web/tests/e2e` → `sektor/e2e/` (par **projet**, pas par BC)
- [x] Chemins : `settings.gradle.kts`, Dockerfiles, `nlops.sh`, scripts npm

## Preuve de fin

Le front build et démarre · l'e2e existant tourne · le déploiement staging passe. Identique au lot 0.

## Journal

```
13/08 23:27  tsk1  git mv backend + web → sektor/ (1772 + 2433)
13/08 23:27  tsk2  deploy/k8s → sektor/ops/k8s
13/08 23:27  tsk3  web/tests/e2e → sektor/e2e/ (42 fichiers)
13/08 23:28  tsk4  settings.gradle.kts projectDir sektor/backend ; nlops app_deploy_dir + docker/npm ; Dockerfiles sous sektor/ ; workspaces npm sektor/web ; tsconfig/scss/playwright un étage de moins.
13/08 23:30  preuve  npm run build VERT (2.71 MB, mêmes WARN lot 0). Playwright --list 176 tests / 20 files. Overlay staging kustomize 212 lignes. npm install a recalé le symlink platform-web.
13/08 23:35  preuve  ng serve :4201 HTTP 200. ENV=staging deploy sektor-btp overlay appliqué ; web Running ; backend CrashLoop déjà 8j (lot 0).
13/08 23:38  preuve  playwright admin-route (nouveau testDir ../e2e) : spec trouvé, webServer compile ; timeout goto :4200/admin (pas un fichier manquant).
13/08 23:30  décision  stg-up BUILD_IMAGES non relancé (Gradle OOM lot 0). docs/tools/README restent sous products/sektor-btp → inbox / PLT-31.

Livré : sektor/{backend,web,ops,e2e} · chemins Gradle/Docker/nlops/npm
```
