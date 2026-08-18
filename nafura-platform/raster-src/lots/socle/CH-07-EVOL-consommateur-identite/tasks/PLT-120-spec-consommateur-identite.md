---
id: PLT-120
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-115]
tags: [platform, socle]
---

# SPEC — consommateur identite

> Indexer `identite` sur tenant / erreurs et `P-IDENTITE-LIRE` · `P-IDENTITE-GERER` dans la matrice socle.

## Étapes

- [x] Aligner les IDs d'action du CH sur la SPEC identite
- [x] Patcher `pact/socle/SPEC.md` (capacités + matrice)
- [x] Préciser / geler le CH (POL, allow/deny ; AC-2 inchangé)
- [x] Rapport de livraison

## Journal

```
16/08 14:15  posée
18/08 10:13  sprint → 2026-W34
18/08 10:34  sprint → 2026-W34
18/08 10:36  status → doing
18/08 10:37  IDs OK vs SPEC identite : lister/lire membre → P-IDENTITE-LIRE (R-1) ;
             inviter / suspendre / retirer / rôles / relancer → P-IDENTITE-GERER
             (R-2 · R-4 · R-5 · R-6 · R-9). AC-2 inchangé. Pas de rôle produit.
18/08 10:38  SPEC socle patchée · CH précisé (POL + allow admin-tenant / deny utilisateur) · AC gelés
18/08 10:36  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `pact/socle/SPEC.md` : capacités Tenant et Erreurs nomment `identite` (en plus des consommateurs déjà là, dont `commentaire` et `notification`) ; matrice indexe `P-IDENTITE-LIRE` · `P-IDENTITE-GERER` (allow `admin-tenant` ; deny `utilisateur`). `CH.md` : IDs confirmés, POL listées, allow/deny dans Attendu, AC-1 · AC-2 gelés inchangés.
critères prouvés     AC-1 → colonnes Consommée par : `identite`. AC-2 → deux lignes matrice sur BC `identite`. Preuve = revue SPEC (pas d'e2e, pas de task exec).
décidé seul          IDs déjà justes côté CH (pas de renommage — contrairement à notification ENVOYER→DEPOSER). Allow = `admin-tenant` seulement : la SPEC identite dit « l'administrateur liste et gère les membres » ; le canvas est un écran admin. Profil courant (R-8) et accepter l'invitation (R-3) n'ont pas de `P-*` — ce n'est pas un deny à inventer. Grain LIRE/GERER (pas un verbe par action) : le BC les nomme déjà ainsi.
écarts / dette       Pas de canvas. Pas de 00-PLAN (pas de task exec). SPEC `identite` non patchée (IDs déjà là ; la note « matrice pas encore indexée » reste — hors périmètre). Autres CH consommateurs intacts.
