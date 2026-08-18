---
id: PLT-126
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-121]
tags: [platform, socle]
---

# SPEC — consommateur approbation

> Indexer `approbation` sur tenant / erreurs et `P-APPROBATION-LIRE` · `P-APPROBATION-DECIDER` dans la matrice socle.

## Étapes

- [x] Aligner les IDs d'action du CH sur la SPEC approbation
- [x] Patcher `pact/socle/SPEC.md` (capacités + matrice)
- [x] Préciser / geler le CH (POL, allow ; AC-2 inchangé)
- [x] Rapport de livraison

## Journal

```
16/08 14:15  posée
18/08 10:13  sprint → 2026-W34
18/08 10:39  sprint → 2026-W34
18/08 10:41  status → doing
18/08 10:42  IDs OK vs SPEC approbation : lister/lire → P-APPROBATION-LIRE (R-1) ;
             demander / accepter / refuser / démarrer un parcours → P-APPROBATION-DECIDER
             (R-2). AC-2 inchangé. Pas de rôle produit.
18/08 10:42  SPEC socle patchée · CH précisé (POL + allow) · AC gelés
18/08 10:42  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `pact/socle/SPEC.md` : capacités Tenant et Erreurs nomment `approbation` (en plus des consommateurs déjà là, dont `commentaire`, `notification` et `identite`) ; matrice indexe `P-APPROBATION-LIRE` · `P-APPROBATION-DECIDER` (allow `admin-tenant`, `utilisateur`). `CH.md` : IDs confirmés, POL listées, allow dans Attendu, AC-1 · AC-2 gelés inchangés.
critères prouvés     AC-1 → colonnes Consommée par : `approbation`. AC-2 → deux lignes matrice sur BC `approbation`. Preuve = revue SPEC (pas d'e2e, pas de task exec).
décidé seul          IDs déjà justes côté CH (pas de renommage). Grain LIRE/DECIDER (pas un verbe par action) : la SPEC approbation les nomme déjà ainsi. Allow = les deux rôles socle — la personne décide via le produit (R-1 · R-2). Ranger une chaîne (R-7, admin-tenant) reste une règle BC, pas un deny de rôle ni un troisième `P-*`.
écarts / dette       Pas de canvas. Pas de 00-PLAN (pas de task exec). SPEC `approbation` non patchée (IDs déjà là). Autres CH consommateurs intacts.
