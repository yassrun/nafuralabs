---
id: SEKTOR-139
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [consultation, etudes]
---

# Overlay etude liste consultations liees

> Clic article : lister les consultations liees a CETTE etude ; deja-dedans visible ; clic = panier d articles ; creer seulement si besoin. Interdit : formulaire fournisseur + cases + deux CTA.

Contrat : [`DECISIONS-PRODUIT.md`](../../DECISIONS-PRODUIT.md) § Overlay (gelé 23/08). Canvas vue Overlay étude.

## Étapes

- [x] Clic article / composant → overlay. **Premier écran** = consultations **liées à cette étude** (pas un formulaire). Chaque ligne : n° · fournisseur · cet article **déjà dans le panier ou pas**.
- [x] Clic une consultation → **ses articles** (panier). S’il n’y est pas → l’ajouter. S’il y est → le dire, ne pas le re-cocher.
- [x] **Créer** seulement si aucune ne convient : fournisseur + **l’article courant** déjà posé. Pas tout l’arbre à cocher. Pas deux CTA Créer / Ajouter à côte à côte sur un formulaire.
- [x] Preuve Mode B (script node) : overlay sans select+checkboxes comme écran 1 ; liste liées ; déjà-dedans ; panier au clic ; create si vide. Vu rouge = l’actuel `consultation-decompo-dialog` formulaire.

## Journal

```
23/08 17:25  posée
23/08 17:26  status → doing
23/08 17:40  preuve écrite → VU ROUGE formulaire 136 encore premier écran
23/08 17:55  overlay liste liées + panier + create article courant
23/08 17:56  preuve verte : chrome + API + Playwright (CS-2026-0036/0037, create CS-2026-0040)
23/08 17:57  status → review
23/08 17:43  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Overlay étude : premier écran = consultations liées à CE dossier (n° · fournisseur · déjà-dedans). Clic ligne = panier ; ajout de l’article courant seulement s’il n’y est pas. Créer = fournisseur + article courant déjà posé. Formulaire 136 (deux selects + cases + deux CTA) retiré.
critères prouvés     Contrat Overlay 23/08 → `verify-consultation-achat-139.mjs` exit 0. Vu rouge avant : `FAIL VU ROUGE overlay : formulaire select+cases+deux CTA (136)`. Vert : chrome liste ; API filtre cette étude (CS-2026-0036 déjà-dedans / CS-2026-0037 pas encore) ; browser liste + panier + déjà-dedans depuis le composant ; PATCH merge sans re-coche ; create article courant seul (CS-2026-0040).
décidé seul          Filtre CE dossier côté client sur `GET ?lien=liee` (pas de nouveau `?dossierEtudeId=`). Toolbar « Consultations » = liste sans article ; déjà-dedans / create seulement depuis un composant. Clic article arbre = toujours le tiroir Coût. Worktree non posé : le formulaire à casser vivait déjà dans l’arbre d’intégration. Spec Playwright non écrite (C:/ vs c:/ = inbox).
écarts / dette       Chrome 136 assert encore le formulaire (inbox). Point IA « déjà chez Lafarge / créer chez X » hors étapes. Pas SEKTOR-140.
