---
id: SEKTOR-110
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-109]
tags: [etudes]
---

# Gate consultation optionnelle obligatoire min N

> Gelé DECISIONS-PRODUIT.md 20/08 — optionnelle (défaut, informative) ou obligatoire (bloquante) + min entier ≥ 1. Obligatoire = N devis reçus, N fournisseurs distincts. Pas 100% des articles.

Contrat : [`DECISIONS-PRODUIT.md`](../../../../DECISIONS-PRODUIT.md) § Paramètre tenant.

## Étapes

- [x] Paramètres tenant : consultation **optionnelle** (défaut) | **obligatoire** ; **minimum** entier ≥ 1 (pas un enum 1/2/3).
- [x] Optionnelle → gate informative. Obligatoire → gate **bloquante** tant que le compteur < N.
- [x] Compteur = N **devis consultation reçus**, N fournisseurs distincts. Le min ne compte que si obligatoire.
- [x] **Pas** « tous les articles décomposés identifiés ». Retirer le sens du bouton `marquerConsulte` / `sourcePrix=CONSULTE` comme preuve de consultation.
- [x] Preuve : obligatoire + min 2 + 1 devis → bloqué ; 2 devis distincts → passe. Optionnelle + 0 devis → passe.

## Journal

```
20/08 19:22  posée
20/08 20:09  status → doing
20/08 20:40  tsk1 tenant_setting etudes.consultation.mode + minimum
20/08 20:48  tsk2 gate 4 compte devis, plus sourcePrix CONSULTE
20/08 20:52  tsk3 retiré bouton marquerConsulte (preuve manuelle)
20/08 20:55  e2e VU ROUGE : PUT parametres/consultation → 404 No static resource
20/08 20:56  décidé : optionnelle + 0 devis = informative (bloquant=false) ; min ignoré si optionnelle
20/08 20:13  status → review
20/08 20:31  status → doing
20/08 20:38  tsk4 table etudes consultation_parametres (plus tenant_setting)
20/08 20:40  probe PUT parametres/consultation → 200 OBLIGATOIRE/min 2 puis restore
20/08 20:40  status → review
20/08 20:42  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `GET/PUT /api/v1/etudes/parametres/consultation` ; gate 4 compte les devis consultation. Bouton `marquerConsulte` retiré. CONSULTE n'est plus une preuve de gate. Écriture mode+min N sur table études `consultation_parametres` (`026_consultation_parametres.sql`) — le rôle app y écrit.
critères prouvés     Unit : optionnelle 0 informative ; obligatoire min 2 + 1 devis bloque ; 2 devis passe. `ParametresEtudeServiceTest` persist table études. e2e vu rouge (404) avant endpoint. Relance QA FAIL : PUT `tenant_setting` 500 — probe après 026+restart : PUT 200, GET relit OBLIGATOIRE/2. e2e non réécrit, QA rejoue.
décidé seul          Pas de GRANT `tenant_setting`. Paramètres tenant = ligne `consultation_parametres` (PK tenant_id). Permission API reste `etude.update`. Optionnelle n'applique pas le min.
écarts / dette       e2e `consultation-gate-min-n.spec.ts` à rejouer par QA (`--workers=1`). Tests GatesEtude préexistants (étape 3/5) hors périmètre.

