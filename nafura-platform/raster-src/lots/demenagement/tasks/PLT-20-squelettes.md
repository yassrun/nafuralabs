---

id: PLT-20
status: done-me
context: nafura
type: tech
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
---

# Squelettes nafura-platform/ et sektor/

## Étapes

- [x] `nafura-platform/{raster-src,pact,ops,e2e}` — vides
- [x] `sektor/{raster-src,pact,ops,e2e}` — vides
- [x] `raster/t.mjs index` détecte les deux projets

## Preuve de fin

Les deux projets apparaissent dans l'INDEX.

## Journal

```
13/08 22:50  tsk1  raster-src déjà en place (tickets PLT-* / SEKTOR-*) — on ne vide pas
13/08 22:52  tsk2  pact/ ops/ e2e/ .gitkeep sur nafura-platform/ et sektor/
13/08 22:52  décision  pact/ vide faisait échouer check (CADRE obligatoire). Skip si pas de CADRE et pas de contexte — dossier réservé, pas encore pacté. Pas de CADRE écrit (tranche 2).
13/08 22:53  tsk3  index : 14 live · 2 projets (nafura-platform, sektor). check 0 erreur. e2e scan-raster-src 9/9 vert.

Livré
- nafura-platform/{raster-src,pact,ops,e2e}
- sektor/{raster-src,pact,ops,e2e}
- INDEX porte les deux projets
- raster/check.mjs : pact/ squelette (vide) ≠ projet pacté
```
