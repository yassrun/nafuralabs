---
id: SEKTOR-130
status: done-me
context: nafura
type: bug
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [etudes, qa-parcours]
---

# Arbre Cout reflète le PU apres Extraire

> Walk DE-0036 : Extraire + composants persistés (DPGF prixUnitaire 1083,75) mais arbre Coût affiche — / 0 jusqu au reload. Fermer le drawer (X, Tout est à jour) n applique le snapshot que si result.saved. Recharger l arbre depuis le DPGF dès que les composants sont écrits.

## Étapes

- [x] Après Extraire / ajout de composants persistés, l’arbre Coût affiche PU HT et Total HT **sans reload** (fermer le drawer X ou « Tout est à jour » suffit).
- [x] `decomposition-workspace` : ne plus n’appliquer le snapshot que si `result.saved` au close — recharger le DPGF (ou appliquer un snapshot) dès que les composants sont écrits en base.
- [x] Header TOTAL HT du dossier suit le même rechargement (`rechargerApresPieces` / synthese).
- [x] Preuve : Extraire + créer/ajouter au moins 1 composant tarifé → fermer le tiroir → PU ≠ « — » dans l’arbre. Vu rouge avant (reste « — » jusqu’au F5).

## Journal

```
20/08 22:48  posée
20/08 22:54  status → doing
20/08 23:12  vue rouge : persist PU 1083,75 drawer ouvert + ✕ → arbre reste « — » (tirets=1)
20/08 23:20  close drawer : toujours treeReloadToken + change (rechargerApresPieces) ; snapshot seulement si saved
20/08 23:28  vue verte : arbre 1.083,75 / 13.005,00 + header TOTAL HT sans F5 (verify-completer-parcours-130.mjs)
20/08 23:01  status → review
22/08 12:20  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `decomposition-workspace` recharge l’arbre DPGF et émet `change` à chaque fermeture du drawer (✕ ou Enregistrer). Header TOTAL HT via `rechargerApresPieces`.
critères prouvés     Mode B `verify-completer-parcours-130.mjs` : persist DPU+PU pendant drawer ouvert, ✕ → PU 1.083,75 et total 13.005 sans F5. Vu rouge avant (reste « — »). Spec `completer-parcours-arbre-pu.spec.ts` écrite, Playwright dual-require.
décidé seul          Extraire IA non invoqué : persist API pendant le drawer ouvert (même close `saved=false`). Snapshot in-mémoire ignoré si `!saved` (stale) — le GET arbre est la source.
écarts / dette       `@playwright/test` dual-require — spec e2e pas verte en CLI Playwright (inbox).
