---
id: RAS-101
status: done-me
context: nafura
type: bug
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [raster, ui]
---

# Projet par defaut : celui qui porte du travail

> L app s ouvrait sur un projet vide et paraissait morte.

## Étapes

- [x] `projetPorteur(projects, tasks)` — pur, exporté
- [x] Les quatre `"raster"` en dur remplacés
- [x] État vide de `Toi` : compte et renvoi vers le backlog
- [x] Test d'absence de nom de projet en dur

## Journal

```
16/08 14:17  posée
16/08 14:20  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `src/App.tsx` — `projetPorteur()` neuf, quatre littéraux `"raster"` retirés, état vide de `Toi` enrichi · `e2e/socle/projet-defaut.test.mjs` (6 tests)
critères prouvés     AC-1 aucun nom de projet en dur dans `src/`, vérifié par grep **et** par test · AC-2 / AC-3 quatre cas purs · AC-4 navigateur : l'accueil affiche « 40 task(s) ouvertes ailleurs » et le Backlog s'ouvre sur `nafura-platform` (39) au lieu de `raster` (1) · suite 64 verts
décidé seul          le départage se fait sur l'**ordre** des projets, pas sur le volume : le premier qui porte du travail gagne. Trier par nombre de tasks ferait sauter l'onglet d'un chargement à l'autre selon l'avancement — un défaut plus pénible que celui qu'on corrige. · Le test charge `projetPorteur` en l'extrayant d'`App.tsx` : `node --test` ne lit pas le TSX. C'est laid, mais ça teste le code réel plutôt qu'une copie qui divergerait.
écarts / dette       la fonction est extraite par expression régulière — la renommer ou changer sa signature casse le test de façon peu lisible. Le vrai remède serait de la sortir dans un module `.ts` sans JSX, hors périmètre ici.
