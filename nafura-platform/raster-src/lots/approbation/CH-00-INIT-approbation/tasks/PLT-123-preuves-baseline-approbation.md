---
id: PLT-123
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-122]
tags: [platform, approbation]
---

# Preuves — baseline approbation

> AC gelés CH-00-INIT. Baseline : établir la vérité, ne pas la faire évoluer.

## Étapes

- [x] Poser `doing`
- [x] Revue SPEC AC-1, AC-2, AC-4, AC-5 (humain)
- [x] Relier les 6 scénarios du CH aux e2e `approbation-*`
- [x] Exécuter `node --test nafura-platform/e2e/approbation/*.test.mjs` (Gradle réel)
- [x] Lire le journal PLT-122 (rouge-puis-vert)
- [x] Rapport de livraison · `done-agent`

## Journal

```
16/08 14:15  posée
17/08 21:07  sprint → 2026-W34
17/08 21:26  status → doing
17/08 21:29  revue SPEC : AC-1 not_owns 5 exclusions nommées ; AC-2 coupe « tout le jar », 0 lot workflow ; AC-4 frontière lisible ; AC-5 pas de règle produit
17/08 21:29  6/6 scénarios CH ont un e2e homonyme
17/08 21:29  `node --test` cache XML 21:21 → invalidé
17/08 21:29  `node --test nafura-platform/e2e/approbation/*.test.mjs` — tests 6 / pass 6 / fail 0 (Gradle ~21 s, XML 20:29:32Z)
17/08 21:32  discrimination : journal PLT-122 21:32 rouge 6 failed (asserts inversés) puis 21:33/21:34 vert
17/08 21:30  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Aucun code. Preuves exécutées sur la baseline actuelle (`e2e/approbation/` + JUnit `ApprobationBaselineTest`).
critères prouvés     AC-1 → revue `pact/approbation/SPEC.md` (`not_owns` : produit, Identité, Notification, Commentaire, documents — chacun nommé). AC-2 → CH + SPEC « tout le jar » ; 0 dossier `raster-src/lots/workflow` ; CADRE carte = `approbation`. AC-3 → `node --test nafura-platform/e2e/approbation/*.test.mjs` — 6 pass / 0 fail (demander, accepter, refuser, deux-tenants, etapes, chaine). AC-4 → SPEC seule tranche owns / not_owns. AC-5 → devis/chantier/Invoice uniquement en exclusion ; INV-1 opaques.
décidé seul          Cache JUnit invalidé pour forcer Gradle (1er `node --test` = 99 ms cache). Discrimination = journal PLT-122, pas un rejeu rouge. PLT-122 tech déjà `done-me` : non re-statusé. Inbox exec laissée (pas de doublon).
écarts / dette       Trouvailes déjà inbox (catalogue `getEntityTypes`, timeout non joué, commentaire refus front vs back, exceptions sans code). Hors INIT.
