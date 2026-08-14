# État des lieux — avant déménagement

Relevé **13/08/2026** (`PLT-1`). Point de comparaison : un rouge après déplacement n'est attribuable que s'il n'était pas déjà là.

Légende : **VERT** = a réussi ici · **ROUGE** = a échoué ici · **WARN** = a réussi avec réserve.

---

## Gradle — `./gradlew build`

**ROUGE** — `java.lang.OutOfMemoryError: Java heap space`

Pas de loopback observé. Le build meurt en compilation parallèle (`org.gradle.parallel=true`, aucun `org.gradle.jvmargs` dans `gradle.properties`).

Tâches vues en `FAILED` (extrait) :

- `:platform:core:observability:compileJava`
- `:platform:features:ai:ai-conversation:compileTestJava`
- `:platform:features:ai:llm-provider:compileTestJava`
- `:platform:features:ai:ai-agent-runtime:compileTestJava`
- `:platform:features:foundation:geo:compileTestJava`
- `:platform:features:administration:iam:compileTestJava`
- `:platform:features:collaboration:comment:compileTestJava`
- `:sektor:etudes|achats|marches|hse|currency|partner|catalogue|item|stock|chantiers|finance|approbations:compileTestJava`

Le process a fallu tuer après ~15 min (workers bloqués post-OOM). Des JAR Sektor déjà présents (`sektor-btp-0.1.0-SNAPSHOT.jar`) datent d'un build antérieur, pas de ce run.

---

## npm — build + démarrage

| Cible | Build | Démarrage |
|-------|-------|-----------|
| **sektor web** `sektor/web` | **VERT** `npm run build` (exit 0, dist écrit) — warnings budget JS 2.71 MB / 500 kB, NG8011, NG8102 | **VERT** `ng serve --configuration=production` → `http://127.0.0.1:4201/` HTTP 200 |
| **corporate** `marketing/corporate` | **VERT** `npm ci` + `npm run build` (exit 0) — `npm audit` : 10 vulns (9 high, 1 critical), next@14.2.18 deprecated | **WARN** `next start` Ready HTTP 200 sur `:3001/fr` mais avertit : *does not work with output: standalone — use `node .next/standalone/server.js`* |
| **mbs-studio** `mbs-studio` | **VERT** `npm run build` (exit 0, export `out/`) — warnings `@next/next/no-img-element` | **ROUGE** `npm start` (`next start`) : *does not work with "output: export"*. **VERT** `npx serve out` → `http://127.0.0.1:3002/` HTTP 200 |

---

## Docker — image se construit, contexte résolu

| Image (`nlops.sh`) | Contexte | Build |
|--------------------|----------|-------|
| `sektor-btp-web` `Dockerfile.web` racine | **VERT** `dist/…/browser` + `nginx.conf` | **VERT** |
| `sektor-btp-backend` `Dockerfile.jar` → `backend/app/build/libs` | **VERT** JAR présent (antérieur) — 2 JAR (`*-plain.jar` + boot) copiés par `COPY *.jar` | **VERT** |
| `venue-catalog-web` `Dockerfile.web` racine | **VERT** dist + nginx.conf | **VERT** |
| `nafura-lifecycle` `tools/lifecycle` | **VERT** `build/changelog` + `build/migrations` | **VERT** |
| `nafura-keycloak` `infra/keycloak` | **VERT** theme + bootstrap | **VERT** |
| `mbs-studio-web` `mbs-studio` | **VERT** | **VERT** |
| `corporate-web` `marketing/corporate` | **VERT** | **VERT** |
| `venue-catalog-backend` `Dockerfile` racine (`./gradlew :venue-catalog:app:bootJar` **dans** l'image) | **VERT** `COPY . .` | **non rejoué** — même Gradle, OOM attendu. Pas de `backend/app/build/libs` local. |

---

## `nlops.sh` — overlays

Chemins `app_deploy_dir` / infra, `ENV=staging|prod` (+ demo infra/sektor).

| Overlay | staging | prod | demo |
|---------|---------|------|------|
| `infra/k8s/overlays/infra/$ENV` | **VERT** | **VERT** | **VERT** |
| `sektor/deploy/k8s/overlays/$ENV` | **VERT** | **VERT** | **VERT** |
| `venue-catalog/deploy/k8s/overlays/$ENV` | **VERT** | **VERT** | — |
| `mbs-studio/deploy/k8s/overlays/$ENV` | **VERT** | **VERT** | — |
| `marketing/corporate/deploy/k8s/overlays/$ENV` | **ROUGE absent** | **VERT** | — |
| `marketing/products/zenith/…` (encore cité `toolchain/ops/AGENTS.md`) | **ROUGE absent** (dossier sorti) | **ROUGE absent** | — |

`nlops.sh` `is_marketing_app` = `corporate\|mbs-studio` seulement — zenith n'est plus une app déployable par le script.

---

## venue-catalog ↔ `:platform:`

**Oui.** 24 `implementation project(':platform:…')` sous `venue-catalog/**/*.gradle` (framework, job-runner, google-places, geo, llm-provider, doc-manager).

Sektor : **57** lignes (chiffre `SEKTOR-81`).

**SEKTOR-81 concerne aussi venue-catalog** — aujourd'hui le ticket ne parle que de Sektor. Sans scission (ou équivalent) pour venue-catalog, `includeBuild` platform cassera le build venue-catalog resté sur `project(':platform:…')` à la racine.

---

## Raster

| Commande | Résultat |
|----------|----------|
| `node raster/t.mjs check` | **VERT** 0 erreur · 4 warnings (`raster/pact` CH sans sous-lot Raster) |
| `node --test raster/e2e/**` | **VERT** 9/9 `scan-raster-src.test.mjs` |

---

## Décisions de relevé (pas des correctifs)

1. Gradle : l'erreur exacte est **OOM heap**, pas un cycle de dépendances. Le « loopback connu » n'a pas pu se manifester.
2. Image `venue-catalog-backend` non construite ici pour ne pas rejouer l'OOM dans Docker.
3. `npm start` MBS est rouge par design (`output: export`) ; le démarrage réel est `serve out` / image nginx.

---

## Rejeu PLT-31 — 13/08/2026 (après déménagement)

Mêmes commandes, chemins to-be. **Aucune régression** vs lot 0.

### Gradle

`./gradlew projects --offline` **VERT** (configure, y compris `:tools:lifecycle` → `nafura-platform/ops/lifecycle`).  
`./gradlew build` **non rejoué** — OOM heap déjà au lot 0.

### npm — build + démarrage

| Cible | Build | Démarrage |
|-------|-------|-----------|
| **sektor web** `sektor/web` | **VERT** `npm run build` (exit 0) — mêmes WARN budget 2.71 MB, NG8011, NG8102 | **VERT** `ng serve --configuration=production` → `http://127.0.0.1:4201/` HTTP 200 |
| **corporate** `corporate/` | **VERT** `npm run build` (exit 0) | non rejoué `next start` (WARN standalone déjà lot 0) |
| **mbs-studio** `mbs-studio/` | **VERT** `npm run build` (exit 0, export `out/`) — mêmes WARN `@next/next/no-img-element` | `npm start` non rejoué (ROUGE by design lot 0) |
| **venue-catalog web** `venue-catalog/web` | **VERT** `npm run build` (exit 0) — hors tableau lot 0 | — |

### Docker

| Image | Build |
|-------|-------|
| `sektor-btp-web` `-f sektor/Dockerfile.web` | **VERT** |
| `venue-catalog-backend` dans l'image | **non rejoué** (OOM attendu, lot 0) |

### Overlays kustomize

| Overlay | staging | prod | demo |
|---------|---------|------|------|
| `nafura-platform/ops/k8s/overlays/infra/$ENV` | **VERT** | **VERT** | **VERT** |
| `sektor/ops/k8s/overlays/$ENV` | **VERT** | **VERT** | **VERT** |
| `venue-catalog/ops/k8s/overlays/$ENV` | **VERT** | **VERT** | — |
| `mbs-studio/deploy/k8s/overlays/$ENV` | **VERT** | **VERT** | — |
| `corporate/deploy/k8s/overlays/$ENV` | **ROUGE absent** | **VERT** | — |

Identique au lot 0 (corporate staging toujours absent).

### venue-catalog ↔ `:platform:`

Toujours **24** `project(':platform:…')`. Inchangé. Toujours pour SEKTOR-81.

### Raster

| Commande | Résultat |
|----------|----------|
| `node raster/t.mjs check` | **VERT** 0 erreur · 4 warnings (`raster/pact` CH sans sous-lot) |
| `node --test raster/e2e/…` | **VERT** 14/14 (9 scan + 5 secrets PLT-13) |
