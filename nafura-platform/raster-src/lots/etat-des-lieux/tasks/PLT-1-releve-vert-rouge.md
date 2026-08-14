---

id: PLT-1
status: done-me
context: nafura
type: tech
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
---

# Relever l'état vert/rouge du workspace

> Le point de comparaison de tout le déménagement. Sans lui, un build rouge n'est pas attribuable.

## Étapes

- [x] Gradle : `./gradlew build` — noter l'erreur exacte si rouge (loopback connu)
- [x] npm : sektor web · corporate · mbs-studio — build + démarrage
- [x] Docker : chaque image se construit, contexte résolu
- [x] `nlops.sh` : tous les chemins d'overlays existent
- [x] venue-catalog dépend-il de `:platform:` ? (décide si SEKTOR-81 le concerne aussi)
- [x] `node raster/t.mjs check` + `node --test raster/e2e/**`
- [x] Écrire le résultat dans `ETAT-DES-LIEUX.md` et **le commiter**

## Preuve de fin

Un fichier commité qui liste, ligne par ligne, ce qui est vert et ce qui est rouge **avant** tout déplacement.

## Journal

```
13/08 22:54  tsk1  ./gradlew build — ROUGE OutOfMemoryError: Java heap space (parallel, pas de jvmargs). Loopback non observé. Process tué ~15 min.
13/08 22:57  tsk2  sektor web npm run build VERT ; ng serve :4201 HTTP 200
13/08 23:08  tsk3  mbs-studio npm run build VERT ; npm start ROUGE (output: export) ; serve out :3002 HTTP 200
13/08 23:08  tsk4  corporate npm ci + build VERT ; next start :3001 HTTP 200 (WARN standalone)
13/08 23:12  tsk5  docker VERT : sektor web/backend, venue web, lifecycle, keycloak, mbs, corporate. venue-catalog-backend non rejoué (gradle dans l'image).
13/08 23:00  tsk6  overlays : corporate staging absent ; zenith sorti. Raster check 0 err, e2e 9/9.
13/08 23:00  tsk7  venue-catalog : 24 project(':platform:') — SEKTOR-81 le concerne. Inbox.

Livré : nafura-platform/ETAT-DES-LIEUX.md
```
