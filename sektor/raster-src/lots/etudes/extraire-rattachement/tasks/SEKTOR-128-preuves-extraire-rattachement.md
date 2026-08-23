---
id: SEKTOR-128
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-118]
tags: [etudes, extraire]
---

# Preuves Extraire rattachement

> Apres Extraire et creer les identites, synthese ne redemande pas Creer/Rapprocher pour les memes lignes.

Ne pas réécrire l’e2e. Rejouer la preuve 118. 124 (tech) : `ng build` compile, pas un verdict QA.

## Étapes

- [x] Extraire + créer 1 identité → synthèse ne reliste pas cette ligne.
- [x] Rapport. `done-agent` sur 118 + cette task si PASS.

## Journal

```
20/08 21:12  posée
20/08 21:27  status → doing
20/08 21:30  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Extraire confirm persiste le DPU (créé = ITEM, restants = LIBRE). GET rattrapage ne reliste plus la ligne créée.
critères prouvés     C1 créé lié / plus dans rattrapage → PASS `node sektor/e2e/scripts/verify-extraire-rattachement-118.mjs` « PASS SEKTOR-118 — créé lié, non créé listé, pas d’auto-création » · C2 non créé reste LIBRE + pas d’auto-création (count +1) → même script · C3 Extraire 2, en créer 1 → synthèse = seulement le non créé → même script. Discrimination : « VU ROUGE extraire-creer seul — encore 2 non rattachés ».
décidé seul          Playwright `extraire-enchaine-rattachement.spec.ts` non jouable (`Requiring @playwright/test second time` / No tests found) — déjà inbox, même contrat que le script node. SEKTOR-124 hors verdict.
écarts / dette       Playwright e2e Extraire depuis `sektor/e2e/` toujours cassé (inbox). Match Extraire incertain non jugé.
