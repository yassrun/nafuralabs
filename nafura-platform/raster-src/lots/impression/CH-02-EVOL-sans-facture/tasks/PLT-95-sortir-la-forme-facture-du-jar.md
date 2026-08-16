---
id: PLT-95
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [PLT-94]
tags: [platform, impression]
sprint: 2026-W33
---

# Sortir la forme facture du jar

> Le jar `impression` n'expose plus la forme facture. Sektor la garde.

## Étapes

- [x] Sortir du jar `impression` ce que visent AC-1 et AC-2
- [x] Écrire `impression-type-opaque` — rouge sur la version d'avant (AC-1, AC-2)
- [x] Laisser la suite `impression-*` verte (AC-4)
- [x] Laisser la forme facture chez Sektor, sans la refondre (AC-5)

## Journal

```
16/08 14:15  posée
16/08 14:23  sprint → 2026-W33
16/08 14:35  spec : étapes nommées, AC-1…AC-5
16/08 14:28  status → doing
16/08 14:30  plan
             tsk1  impression-type-opaque d'abord (scan jar + rendu sac) — doit échouer tant que PrintDocument est dans impression
             tsk2  sortir PrintDocument / Line / Totals du jar ; getDocument → sac opaque (Object)
             tsk3  déplacer le type chez Sektor (etudes + ventes print) sans refondre la facture
             tsk4  JUnit typeOpaque + suite impression-* verte
             tsk5  rapport → review
16/08 14:40  tsk1  impression-type-opaque ROUGE avant (PrintDocument + Line + Totals encore dans le jar)
16/08 14:45  tsk2–4  type sorti ; sac opaque ; suite impression-* 5/5 verte
16/08 14:33  status → review
16/08 14:42  status → doing
16/08 14:44  QA fail AC-5 — plan
             tsk6  test Gradle ventes : tenant + id facture → PDF %PDF (sans 8082)
             tsk7  exécuter la commande depuis le worktree ; journaler sortie
16/08 14:46  tsk6–7  AC-5 exécuté
             cmd: cd sektor/sources/backend && ./gradlew :sektor:ventes:test --tests ma.nafura.ventes.print.VentesFacturePrintAc5Test
             tenant=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa (qa-local)
             factureId=33333333-3333-3333-3333-333333333333
             numero=FAC-2026-001 pdfMagic=%PDF bytes=1778
             BUILD SUCCESSFUL
16/08 14:47  status → review
16/08 14:51  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Ce qui a changé.** `PrintDocument` / `Line` / `Totals` hors du jar `impression`. Entrée de rendu = modèle + sac opaque (`renderOpaque`, `getDocument` → `Optional<Object>`). La forme facture/devis vit chez Sektor (`etudes.print` + `ventes.print`), mapping et templates inchangés. Preuve AC-5 : `VentesFacturePrintAc5Test` (forme déplacée + template `facture-client-a4` → PDF `%PDF`).

**Critères prouvés.** AC-1 / AC-2 → `impression-type-opaque` (inchangé, déjà pass). AC-4 → suite `impression-*` 5/5 (inchangé). AC-3 = SPEC. AC-5 → commande Gradle ventes exécutée : tenant `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`, facture `33333333-3333-3333-3333-333333333333`, `FAC-2026-001`, `pdfMagic=%PDF` 1778 octets.

**Décidé seul.** Type dupliqué dans `etudes.print` et `ventes.print`. `getDocument` opaque. Catalogue/tokens config laissés. Substitutions `includeBuild` dans `sektor/sources/backend/settings.gradle.kts` pour que le test ventes tourne sans mavenLocal. PDF module sans Gotenberg (ops / stack down).

**Écarts / dette.** Stack 8082/4200 toujours down — preuve module, pas live. Catalogue `document.totaux.*` encore dans le jar impression (config hors périmètre).

## Question

aucune
