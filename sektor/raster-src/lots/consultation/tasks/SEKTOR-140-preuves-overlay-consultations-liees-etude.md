---
id: SEKTOR-140
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-139]
tags: [consultation]
---

# Preuves overlay consultations liees etude

> Rejouer liste liees, deja-dedans, panier au clic, creer si besoin. Ne pas reecrire les e2e.

## Étapes

- [x] Overlay étude : liste des consultations liées ; déjà-dedans visible ; clic = articles du panier ; créer seulement si besoin. Rapport. `done-agent` sur 139 + cette task si PASS.

## Journal

```
23/08 17:25  posée
23/08 17:41  status → doing
23/08 17:42  rejoué verify-consultation-achat-139.mjs exit 0 — chrome + API + browser ; pas de SKIP cursor-session
23/08 17:43  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Rien — QA n’a pas touché le produit. Rejoué `node sektor/e2e/scripts/verify-consultation-achat-139.mjs` (Mode B `qa@nafuralabs.local` / `qa-local`, API 8082, front `127.0.0.1:4200`).
critères prouvés     Overlay 23/08 → script exit 0. 1 premier écran = liées cette étude (pas formulaire 136) → chrome `ok chrome : overlay liste liées, pas le formulaire 136` + browser liste + API filtre CE dossier (CS-2026-0041 / 0042, autre étude / hors étude exclus). 2 n° · fournisseur · déjà-dedans → API ciment dans 0041, pas dans 0042 + chrome `déjà dedans`. 3 clic → panier ; pas dedans → ajouter ; déjà dedans → pas re-cocher → browser `ok browser overlay liste liées + panier au clic` + PATCH `ok ajout article courant au panier, pas de re-coche`. 4 créer si besoin = fournisseur + article courant seul → chrome `articleCourant` / plus `collectIdentitesDecompo` + POST CS-2026-0045 (`clesStables` = ciment seul).
décidé seul          Vu rouge avant lu dans le journal 139 (17:40 `preuve écrite → VU ROUGE formulaire 136 encore premier écran`) — le script throw encore `VU ROUGE overlay : formulaire select+cases+deux CTA (136) encore premier écran`. Playwright CLI C:/ vs c:/ = inbox, non bloquant (script node = preuve). SKIP `cursor-session` exit 0 non déclenché (session 200). `approve` non appelé.
écarts / dette       Browser composant `ouvrir-consultation-composant` timeout 8s → skip prévu du script (`liste+panier déjà vus`). déjà-dedans UI depuis le composant non revu ce run ; couvert chrome + API. Pas de correctif.
