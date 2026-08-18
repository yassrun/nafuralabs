---
id: PLT-132
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-127]
tags: [platform, socle]
---

# SPEC — consommateur conversation

> Indexer `conversation` sur tenant / erreurs et `P-CONVERSATION-LIRE` · `P-CONVERSATION-ECRIRE` dans la matrice socle.

## Étapes

- [x] Trancher les IDs d'action contre la SPEC conversation (R-1…R-5)
- [x] Patcher `pact/socle/SPEC.md` (capacités + matrice)
- [x] Préciser / geler le CH (POL, allow ; AC-2 inchangé)
- [x] Rapport de livraison

## Journal

```
16/08 14:15  posée
18/08 10:13  sprint → 2026-W34
18/08 10:42  sprint → 2026-W34
18/08 10:44  status → doing
18/08 10:45  IDs tranchés : P-CONVERSATION-LIRE · P-CONVERSATION-ECRIRE
             (pas un P-* par R-1…R-5). AC-2 inchangé. Pas de rôle produit.
18/08 10:45  SPEC socle patchée · CH précisé (POL + allow) · AC gelés
18/08 10:45  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `pact/socle/SPEC.md` : capacités Tenant et Erreurs nomment `conversation` (en plus des consommateurs déjà là, dont `commentaire`, `notification`, `identite` et `approbation`) ; matrice indexe `P-CONVERSATION-LIRE` · `P-CONVERSATION-ECRIRE` (allow `admin-tenant`, `utilisateur`). `CH.md` : IDs confirmés, POL listées, allow dans Attendu, AC-1 · AC-2 gelés inchangés.
critères prouvés     AC-1 → colonnes Consommée par : `conversation`. AC-2 → deux lignes matrice sur BC `conversation`. Preuve = revue SPEC (pas d'e2e, pas de task exec).
décidé seul          Grain LIRE/ECRIRE retenu, pas un `P-*` par R-1…R-5. R-1 → LIRE (lister/lire session). R-2 → `POL-TENANT-ISOLATION`, pas un `P-*`. R-3 → invariant session vide. R-4 (proposer / approuver / refuser / exécuter) → ECRIRE : cycle de vie BC, comme auteur-seul commentaire, pas un `P-CONVERSATION-AGIR` (mêmes acteurs, mêmes allow ; SPEC : « mêmes actions dans son tenant »). R-5 (SELECT n'écrit pas) → contrainte de voie, pas un `P-*`. Allow = les deux rôles socle. Pas de rôle produit.
écarts / dette       SPEC `conversation` non patchée (aucun `P-*` aujourd'hui — pas une erreur de contrat, ce CH cible le socle ; le BC les référence après indexation). `llm-provider` comme capacité socle : l'INIT le renvoyait ici, les AC gelés ne le portent pas. Pas de canvas. Pas de 00-PLAN (pas de task exec). Autres CH consommateurs intacts.
