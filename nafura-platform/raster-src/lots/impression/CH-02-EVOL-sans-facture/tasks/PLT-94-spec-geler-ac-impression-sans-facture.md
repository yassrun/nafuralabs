---
id: PLT-94
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: none
tags: [platform, impression]
---

# SPEC + geler AC — impression sans facture

> Contrat opaque : plus de forme facture dans `impression`. AC gelés pour PLT-95.

## Étapes

- [x] Relire SPEC vs CH — `EVOL` confirmé (baseline CH-00 ; contrat encore `PrintDocument`)
- [x] Patcher SPEC `impression` (sac opaque, noms interdits, `not_owns` forme métier, POL listées)
- [x] Geler AC-1…AC-5, scénarios e2e + état initial, POL — AC-5 = non-régression Sektor
- [x] Une exec (PLT-95) : pas de 00-PLAN ; canvas inchangé
- [x] Nommer les étapes PLT-95 / PLT-96 (références AC-n)

## Journal

```
16/08 14:15  posée
16/08 14:23  sprint → 2026-W33
16/08 14:24  status → doing
16/08 14:25  EVOL confirmé. SPEC patchée (opaque + noms interdits). AC-1…AC-5 gelés. Canvas inchangé. Pas de 00-PLAN.
16/08 14:26  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `pact/impression/SPEC.md` — sac opaque, noms interdits (`PrintDocument`, TVA/lignes/totaux), `not_owns` forme métier = produit. `pact/impression/CH-02-EVOL-sans-facture/CH.md` — AC-1…AC-5 gelés, scénarios, POL.
critères gelés       AC-1 · AC-2 · AC-3 · AC-4 · AC-5
décidé seul          Canvas inchangé (écran config hors périmètre). Une seule exec (PLT-95), pas de 00-PLAN. AC-5 = non-régression produit Sektor, pas un e2e platform. `EntityDataProvider` non nommé dans la SPEC (le contrat est le sac opaque).
écarts / dette       Les 5 erreurs `check` (SPEC manquantes hors impression) hors périmètre, non corrigées.
