---

id: PLT-34
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-33]
---

# Fusionner README.md dans NAFURALABS.md

> Une seule porte à la racine : `NAFURALABS.md`. Plus de README concurrent.

## Étapes

- [x] Contenu utile de `README.md` (démarrage, produits) dans `NAFURALABS.md`
- [x] Supprimer `README.md` à la racine ; liens live → `NAFURALABS.md`
- [x] GitHub : `README.md` pointe vers `NAFURALABS.md` (affichage repo, pas un 2ᵉ canon)

## Preuve de fin

`NAFURALABS.md` porte vision + démarrage + produits + structure. `README.md` racine n'est plus qu'un pointeur.

## Journal

```
14/08 00:38  tsk1  Démarrage rapide + table produits (README) dans NAFURALABS.md. Plus de pointeur docs/AGENTS.md comme canon.
14/08 00:38  tsk2  README.md racine = 4 lignes vers NAFURALABS.md (GitHub affiche README ; le canon est NAFURALABS.md).

Livré : une porte NAFURALABS.md
```
