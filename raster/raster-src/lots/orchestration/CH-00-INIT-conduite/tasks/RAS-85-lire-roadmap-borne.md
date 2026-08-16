---
id: RAS-85
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [RAS-81]
tags: [raster, cli, orchestration]
---

# Lire la roadmap et la borne

> La fenêtre de travail, calculée : les lots ouverts, et le prochain.
> Couvre AC-2 de [`CH.md`](../../../../../pact/orchestration/CH-00-INIT-conduite/CH.md).

## Étapes

- [x] `roadmap.mjs` : lire `<projet>/ROADMAP.md`, repérer `<!-- borne -->`
- [x] Lots cités **au-dessus** du marqueur = la fenêtre ; en dessous = fermés
- [x] Pas de marqueur, ou borne en tête → fenêtre **vide** (jamais ouverte par défaut)
- [x] `t.mjs window [--projet] [--json]` — fenêtre + sous-lots lançables (via `ready`)
- [x] Un lot cité sans dossier `raster-src` : signalé, pas fatal

## Journal

```
16/08  posée
16/08 13:32  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `raster/roadmap.mjs` (neuf) — `parseRoadmap` pur, `readRoadmap`, `window_`, `t.mjs window [--json]`
critères prouvés     AC-2 six tests dans `e2e/orchestration/roadmap-borne.test.mjs` : borne au milieu, pas de marqueur, borne en tête, fichier vide, casse et espaces du marqueur, gras hors liste numérotée · sur le dépôt réel, `window raster` sort `work` lançable et `orchestration` bloqué
décidé seul          un lot est reconnu par `N. **slug**` en liste numérotée — assez strict pour que le gras au fil du texte ne devienne pas un lot, assez souple pour rester écrit à la main · un lot cité **sans dossier** est signalé et non fatal : la roadmap a le droit de porter ce qui n'existe pas encore
écarts / dette       `window` fait deux passes de lecture disque (roadmap puis readiness)
