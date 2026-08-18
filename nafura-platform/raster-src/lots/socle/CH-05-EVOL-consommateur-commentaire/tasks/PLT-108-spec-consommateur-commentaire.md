---
id: PLT-108
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-103]
tags: [platform, socle]
---

# SPEC — consommateur commentaire

> Indexer `commentaire` sur tenant / erreurs et `P-COMMENTAIRE-LIRE` · `P-COMMENTAIRE-ECRIRE` dans la matrice socle.

## Étapes

- [x] Vérifier les IDs d'action contre la SPEC commentaire
- [x] Patcher `pact/socle/SPEC.md` (capacités + matrice)
- [x] Préciser / geler le CH (POL, allow ; AC-2 inchangé)
- [x] Rapport de livraison

## Journal

```
16/08 14:15  posée
18/08 10:13  sprint → 2026-W34
18/08 10:20  status → doing
18/08 10:22  IDs OK vs SPEC commentaire : lire le fil → P-COMMENTAIRE-LIRE ;
             poster / répondre / corriger / retirer → P-COMMENTAIRE-ECRIRE.
             AC-2 inchangé. Pas de rôle produit.
18/08 10:23  SPEC socle patchée · CH précisé (POL + allow) · AC gelés
18/08 10:22  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `pact/socle/SPEC.md` : capacités Tenant et Erreurs nomment `commentaire` ; matrice indexe `P-COMMENTAIRE-LIRE` et `P-COMMENTAIRE-ECRIRE` (allow `admin-tenant`, `utilisateur`). `CH.md` : POL listées, allow dans Attendu, AC-1 · AC-2 gelés inchangés.
critères prouvés     AC-1 → colonnes Consommée par : `commentaire`. AC-2 → deux lignes matrice sur BC `commentaire`. Preuve = revue SPEC (pas d'e2e, pas de task exec).
décidé seul          Grain lire/écrire (pas un verbe par action) : la SPEC commentaire raconte le fil, pas cinq permissions. Auteur-seul (R-2) reste une règle BC, pas un deny de rôle. Allow = les deux rôles socle — l'admin n'a pas davantage (SPEC : « les mêmes actions »).
écarts / dette       La SPEC `commentaire` ne référence pas encore les `P-…` (hors périmètre INIT + ce CH). Pas de canvas. Pas de 00-PLAN (pas de task exec).
