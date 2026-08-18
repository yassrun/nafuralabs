---
id: PLT-96
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-95]
tags: [platform, impression]
---

# Preuves — impression sans facture

> Vérifier les AC gelés du CH-02. AC-5 = non-régression Sektor, pas un e2e platform.

## Étapes

- [x] Exécuter `impression-type-opaque` (AC-1, AC-2)
- [x] Vérifier AC-3 sur la SPEC `impression`
- [x] Exécuter la suite `impression-*` (AC-4)
- [x] Vérifier la non-régression produit Sektor (AC-5) — pas un e2e `nafura-platform/e2e`

## Journal

```
16/08 14:15  posée
16/08 14:23  sprint → 2026-W33
16/08 14:35  spec : étapes nommées, AC-1…AC-5
16/08 14:38  status → doing
16/08 14:39  worktree : node --test nafura-platform/e2e/impression/*.test.mjs → 5/5 pass (fail 0)
16/08 14:40  Gradle --rerun-tasks ImpressionBaselineTest (rendrePdf, deuxTenants, typeOpaque) BUILD SUCCESSFUL, 3/3, failures=0
16/08 14:41  AC-3 : SPEC impression not_owns « La forme d'un document métier » → le produit
16/08 14:41  discrimination type-opaque : PLT-95 journal 14:40 « ROUGE avant »
16/08 14:42  AC-5 : 8082/4200 down ; qa-token fail ; aucun e2e sektor n'imprime une facture
16/08 14:43  verdict fail — trou AC-5
16/08 14:42  status → blocked
16/08 14:48  status → doing
16/08 14:51  AC-5 relancé --rerun-tasks : tenant=aaaaaaaa-… factureId=33333333-… numero=FAC-2026-001 pdfMagic=%PDF bytes=1778 BUILD SUCCESSFUL
16/08 14:51  verdict pass
16/08 14:51  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Preuves CH-02 exécutées depuis le worktree. Aucun code produit, aucun e2e, aucune SPEC touchés.
critères prouvés     AC-1 → `impression-type-opaque` (scan jar) **pass** (tour 1). AC-2 → même test + JUnit `typeOpaque` **pass** (tour 1). AC-3 → revue SPEC `not_owns` forme métier → produit **pass**. AC-4 → suite `impression-*` 5/5 + Gradle ImpressionBaselineTest 3/3 **pass**. AC-5 → `./gradlew :sektor:ventes:test --rerun-tasks --tests ma.nafura.ventes.print.VentesFacturePrintAc5Test` **pass** : tenant `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`, facture `33333333-3333-3333-3333-333333333333`, `FAC-2026-001`, `pdfMagic=%PDF` 1778 octets.
décidé seul          AC-1…AC-4 non rejoués (sorties du tour précédent, ~1 h). AC-5 : premier run UP-TO-DATE rejeté ; `--rerun-tasks` pour voir tenant / id / `%PDF` dans la sortie QA.
écarts / dette       Preuve AC-5 = module Gradle (pas live 8082/4200). Catalogue `document.totaux.*` encore dans le jar impression — hors périmètre config (déjà noté exec).
