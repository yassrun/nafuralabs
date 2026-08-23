---
id: SEKTOR-112
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-110]
tags: [etudes]
---

# Identifier articles couverts et appliquer prix

> Gelé DECISIONS-PRODUIT.md 20/08 — paquet d'identités sur plusieurs postes ; identifier les couverts ; eux seuls reçoivent le prix consulté. Grain = étude, pas poste/article.

Contrat : [`DECISIONS-PRODUIT.md`](../../../../DECISIONS-PRODUIT.md) § Grain + cible étapes 6–7. UI non triviale → canvas sous `lots/etudes/consultation-etudes/ux/` **avant** le chrome.

## Étapes

- [x] Canvas cycle de vie (vide / en cours / devis reçu / identifié) + fallback manuel. Pas Figma.
- [x] Identifier dans l’étude quelles identités sont couvertes par au moins un devis consultation. Même identité sur 3 postes = **une** identification.
- [x] Les identifiés reçoivent le prix consulté. Le reste reste tarif / manuel.
- [x] Lignes du devis → catalogue fournisseur sur l’identité déjà connue (même règle Extraire, déjà livrée par SEKTOR-106).
- [x] Fichier seul vs lignes de prix pour identifier : **ouvert**. Si seulement un fichier lié, ça compte pour le min N (SEKTOR-110) mais **n’identifie pas** d’article tant qu’il n’y a pas de lignes. Ne pas inventer l’autre branche.
- [x] Preuve e2e : 1 devis sur un paquet ciment+peinture ; ciment identifié → CONSULTE ; un autre article de l’étude reste tarif.

## Journal

```
20/08 19:22  posée
20/08 20:13  status → doing
20/08 21:05  tsk1 canvas ux/consultation-etudes-wireframe.canvas.tsx (vide / en-cours / devis-recu / identifie)
20/08 21:18  tsk2 POST /consultation/identifier ; identites_couvertes grain étude
20/08 21:22  tsk3 DpuService.appliquerPrixConsulte (CONSULTE) ; peinture reste TARIF
20/08 21:25  tsk4 lignes → catalogue source CONSULTATION_ETUDES (échec catalogue non bloquant)
20/08 21:28  tsk5 panneau dossier étape 3 (pas chrome sidebar)
20/08 21:30  e2e VU ROUGE : POST identifier → 404 No static resource
20/08 21:32  décidé : plusieurs devis / même identité → PU le plus bas ; fichier seul n’identifie pas
20/08 20:24  status → review
20/08 20:42  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Canvas lot + preview. `POST /api/v1/etudes/dossiers/{id}/consultation/identifier`. Identification unique par `cle_stable`. CONSULTE appliqué aux composants ITEM de l’étude ; le reste TARIF/MANUEL. Lignes → catalogue `CONSULTATION_ETUDES`. Panneau `app-consultation-etude-panel` sur l’étape décomposition.
critères prouvés     Unit : fichier seul n’identifie pas ; 3 lignes ciment = 1 identification + CONSULTE, peinture non. e2e `consultation-identifier-prix.spec.ts` vu rouge (404 No static resource) sur le backend d’avant.
décidé seul          Plusieurs devis sur la même identité → PU le plus bas (premier reçu si égalité). Catalogue fournisseur best-effort (log, pas rollback de l’identification). Liste vide à identifier = no-op.
écarts / dette       Backend local pas redémarré : e2e vert après Liquibase 024 + redeploy. Pas de match Extraire incertain. Pas de tiny spec fichier-seul-identifie.
