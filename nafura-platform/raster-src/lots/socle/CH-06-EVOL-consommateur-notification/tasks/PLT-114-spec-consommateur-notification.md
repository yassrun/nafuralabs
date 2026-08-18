---
id: PLT-114
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-109]
tags: [platform, socle]
---

# SPEC — consommateur notification

> Indexer `notification` sur tenant / erreurs et `P-NOTIFICATION-LIRE` · `P-NOTIFICATION-MARQUER` · `P-NOTIFICATION-DEPOSER` dans la matrice socle.

## Étapes

- [x] Aligner les IDs d'action du CH sur la SPEC notification
- [x] Patcher `pact/socle/SPEC.md` (capacités + matrice)
- [x] Préciser / geler le CH (POL, allow ; AC-2 aligné)
- [x] Rapport de livraison

## Journal

```
16/08 14:15  posée
18/08 10:13  sprint → 2026-W34
18/08 10:27  sprint → 2026-W34
18/08 10:28  status → doing
18/08 10:30  IDs : CH parlait LIRE · ENVOYER ; SPEC notification (R-1 · R-2 · R-3)
             = LIRE · MARQUER · DEPOSER. CH aligné sur le BC, pas l'inverse.
             Allow = admin-tenant, utilisateur ; deny aucune. Pas de rôle produit.
18/08 10:31  SPEC socle patchée · CH gelé (POL + allow + AC-2)
18/08 10:29  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `pact/socle/SPEC.md` : capacités Tenant et Erreurs nomment `notification` (en plus des consommateurs déjà là, dont `commentaire`) ; matrice indexe `P-NOTIFICATION-LIRE` · `P-NOTIFICATION-MARQUER` · `P-NOTIFICATION-DEPOSER` (allow `admin-tenant`, `utilisateur`). `CH.md` : IDs alignés, POL listées, allow dans Attendu, AC-1 inchangé, AC-2 gelé sur les trois IDs du BC.
critères prouvés     AC-1 → colonnes Consommée par : `notification`. AC-2 → trois lignes matrice sur BC `notification`. Preuve = revue SPEC (pas d'e2e, pas de task exec).
décidé seul          `P-NOTIFICATION-ENVOYER` n'existe pas côté BC — retenu LIRE / MARQUER / DEPOSER (SPEC notification R-1 · R-2 · R-3). Boîte perso (R-1 · R-2) = règle BC, pas un deny de rôle. Allow = les deux rôles socle ; l'admin n'a pas davantage (SPEC : lectures pour lui-même). Déposer = le produit demande ; pas de rôle « bâtisseur ».
écarts / dette       Pas de canvas. Pas de 00-PLAN (pas de task exec). SPEC `notification` non patchée (IDs déjà là). Autres CH consommateurs intacts.
