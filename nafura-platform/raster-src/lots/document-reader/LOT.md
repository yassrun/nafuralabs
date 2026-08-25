# Document reader — moteur unique dans doc-extractor

> La plateforme lit une **grille** ; le produit interprète. L’IA compile un plan, elle ne lit pas les données.
> Ce fichier décrit le périmètre durable du lot. Archive historique : `Desktop/nafuralabs-archives/sektor-btp-docs-specs/lots/cadrage/document-reader/`.

**Où :** `nafura-platform/sources/backend/features/documents/doc-extractor/` (+ UI `smart-import`).
**Pas dans ce lot :** lecteur d’ancres (vague 2) · rapprochement BL/facture · matrice / blocs multiples (vague 3) · découverte de schéma · reprise d’onboarding · écrans demandeurs (`ecrans-lecture-documents`).

## Constat

Deux piles. `StatelessExtractionService` aplatit en texte puis paie un LLM. `etudes/.../bordereau/grid` lit une grille (703 articles / 4 fichiers, 0 appel). Tout ce qu’importe la pile plateforme est tabulaire — un seul problème.

## Ordre

Lot 0 d’abord (étalon vert). Cache **par tenant** (O1, 14/08). Bascule **par forme**, pas par écran.

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | PLT-39 Socle grille dans doc-extractor | — | **oui** avec PLT-40 |
| 2 | PLT-40 Trancher O1 — cache par tenant ou mutualisé | — | **oui** avec PLT-39 |
| 3 | PLT-41 Plan, cascade, cache | PLT-39, PLT-40 | non |
| 4 | PLT-42 Plan ↔ Definition | PLT-41 | non |
| 5 | PLT-43 Carte des doutes | PLT-42 | non |
| 6 | PLT-44 Bascule vague 1 (`liste` puis `arbre`) | PLT-43 | non |

## Critères (gelés ici, pas de CH)

- **AC-1** Les 703 articles / 4 fichiers restent verts de PLT-39 à PLT-44.
- **AC-2** Aucun écran déjà câblé sur `smart-import` ne perd de fonctionnalité à la bascule.
- **AC-3** `AdaptiveBordereauExtractionOrchestrator.lastDiagnostics` n’est plus un état mutable partagé.
- **AC-4** Aucune classe plateforme ne connaît `DpgfNoeud` ; aucune classe Sektor ne connaît une empreinte de trame.
- **AC-5** Deux natures de doutes, jamais fusionnées à l’écran : doute d’extraction ≠ manque de la source.
- **AC-6** Le chemin LLM actuel (`StatelessExtractionService`) reste les paliers 3 et 4 — scans et documents sans grille.

## Décisions

- **O1** (14/08, me) — cache de plans **par tenant**. Mutualiser ferait sortir une empreinte de mise en page du périmètre d’un tenant. Un catalogue éditeur opt-in = plus tard (O4), pas ce lot.
- O2–O4 (vagues 2–3 / écran de relecture) — hors ce lot.
