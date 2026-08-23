---
id: SEKTOR-145
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-142, SEKTOR-143, SEKTOR-144]
tags: [sektor, ux, catalogue]
---

# Preuves picker article partagé

> Scénarios e2e nommés dans CONTRAT.md + état initial qa-local.

## Étapes

- [x] Jouer les scénarios e2e nommés dans [`CONTRAT.md`](../CONTRAT.md) (ne pas les réécrire). État initial : tenant `qa-local`, ≥ 30 articles, 2 familles, natures distinctes, 1 code exact `ART-…`.
- [x] Relier chaque **AC-1**…**AC-14** à une preuve exécutée.
- [x] Vérifier la discrimination (journaux exec rouge-avant).
- [x] Verdict + rapport ; `done-agent` sur 142 / 143 / 144 et cette qa.

## Journal

```
23/08 17:31  posée
23/08 18:34  status → doing
23/08 18:38  status → blocked
23/08 18:44  status → doing
23/08 18:45  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Rien (QA). Rejoué `verify-picker-article-142.mjs` / `143.mjs` / `144.mjs` — les trois **PASS**. Front `127.0.0.1:4200` + API `8082` up. 143 étendu : clavier, qty+PU, AC-12 preset/humain, 0 hit, erreur+Relancer.
critères prouvés     AC-1…6 → 142 `PASS search vide=0 exact=ART-P142-mt63k8vm nature=3 pageTotal=41` + 143 `PASS picker-ouverture-vide`. AC-7/8/9/12/13/14 → 143 `PASS` qty+PU, clavier, preset/humain, 0 hit, Relancer. AC-10/11 → 144 `PASS` stock + lookup.
décidé seul          PASS global. `done-agent` sur 142, 143, 144 et 145. SKIP = pas un pass (aucun SKIP). Discrimination : journaux exec (142 rouge 500 `/{id}` ; 143 dump 40 ; 144 dump size 500).
écarts / dette       Hors v1 inchangé (SKU barre, listing articles, sorties/inventaire, import BL). AC-7 toujours un `\d` dans le hit. Debounce 300 ms non isolé.
