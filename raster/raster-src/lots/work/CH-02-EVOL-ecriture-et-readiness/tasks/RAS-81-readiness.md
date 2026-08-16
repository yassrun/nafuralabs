---
id: RAS-81
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [raster, cli, orchestration]
---

# Readiness — `t.mjs ready`

> Quels sous-lots sont lançables maintenant. Calculé, jamais stocké.
> Couvre AC-4 de [`CH.md`](../../../../../pact/work/CH-02-EVOL-ecriture-et-readiness/CH.md).

## Étapes

- [x] `ready.mjs` : grouper les tasks par sous-lot, résoudre `blocked_by` en ids réels
- [x] Lançable ⇔ aucune dépendance **hors du sous-lot** encore ouverte
- [x] Non lançable si une task porte `status: blocked` (externe)
- [x] `blocked_by` interne = ordre seulement, jamais un blocage du sous-lot
- [x] `ready [--projet]` — sortie lisible + `--json` pour le skill

## Journal

```
16/08  posée
16/08 13:32  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `raster/ready.mjs` (neuf) — `computeReadiness` pur + `readiness()` sur dépôt, `t.mjs ready [--json]`
critères prouvés     AC-4 huit cas dans `e2e/work/readiness.test.mjs`, tous verts · sur le dépôt réel : `CH-00-INIT-conduite` sort « attend RAS-81 », première dépendance croisée entre sous-lots
décidé seul          un **bloqueur inconnu bloque** au lieu d'être ignoré — `PLT-33` référence `PLT-32` disparu au sweep, l'ignorer aurait rendu lançable un sous-lot dont la dépendance est perdue · un sous-lot clos n'est jamais « lançable » : il n'y a rien à lancer
écarts / dette       `loadForReadiness` relit tous les fichiers à chaque appel — `window` en fait deux passes
