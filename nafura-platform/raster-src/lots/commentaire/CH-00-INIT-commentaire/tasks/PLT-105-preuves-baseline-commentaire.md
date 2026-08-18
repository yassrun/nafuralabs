---
id: PLT-105
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-104]
tags: [platform, commentaire]
---

# Preuves — baseline commentaire

> 2 lignes max.

## Étapes

- [x] Revue SPEC AC-1 / AC-2 / AC-4 / AC-5
- [x] Vérifier vu-rouge consigné (PLT-104)
- [x] Exécuter `node --test` e2e ; forcer Gradle si cache XML
- [x] Relier chaque AC à un pass/fail exécuté
- [x] Rapport de livraison

## Journal

```
16/08 14:15  posée
17/08 21:09  sprint → 2026-W34
17/08 21:26  status → doing
17/08 21:28  revue SPEC : AC-1 not_owns 6 exclusions, chacune nomme qui.
             AC-2 coupe mention/notification/modération écrite.
             AC-4 lisible seule. AC-5 zéro règle produit.
             Vu-rouge PLT-104 consigné (21:32, 6 scénarios).
17/08 21:28  1er node --test : 6/6 pass — XML JUnit daté 20:21:12Z (run exec).
             Cache écarté. Gradle --rerun-tasks CommentBaselineTest :
             BUILD SUCCESSFUL 32s, 5 JUnit, 0 fail (timestamp 20:31:21Z).
17/08 21:32  2e node --test : 6/6 pass (fail 0). Verdict pass.
17/08 21:32  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Preuves CH-00-INIT-commentaire exécutées. Aucun code produit, aucun e2e, aucune SPEC touchés. PLT-104 non rouverte.
critères prouvés     AC-1 → lu `pact/commentaire/SPEC.md` : fichier présent ; `not_owns` 6 lignes, chacune nomme qui (identité / notification / non spécifié·produit / le produit / identité / socle app cliente). AC-2 → même SPEC : coupe explicite « commenter = fil + messages. Mention dehors. Notification dehors. Modération dehors. ». AC-3 → `node --test nafura-platform/e2e/commentaire/*.test.mjs` 6/6 pass (poster-et-lire · deux-tenants · auteur-seul · retirer · repondre · frontiere-produit) ; Gradle `--rerun-tasks` CommentBaselineTest BUILD SUCCESSFUL, 5 JUnit, failures=0. AC-4 → owns / not_owns / R-1–R-6 suffisent à classer un besoin. AC-5 → INV-1 + `entité`/`id` opaques ; devis/chantier/FACTURE seulement comme exclusions.
décidé seul          XML JUnit 20:21:12Z rejeté comme preuve de ce Change. Gradle relancé avec `--rerun-tasks` avant le 2e `node --test`. Vu-rouge lu dans PLT-104, pas relancé. Dette POL-ERREUR-CODE / `dpgf_noeud` déjà inbox — non bloquante (baseline photographie).
écarts / dette       Widget : pas d'e2e UI (preuves CH = API + scan compile). `POL-ERREUR-CODE` non tenu (403 / CrudNotFoundException) — inbox. `CommentServiceImplTest` garde `dpgf_noeud` — inbox. Pas de trou d'AC.
