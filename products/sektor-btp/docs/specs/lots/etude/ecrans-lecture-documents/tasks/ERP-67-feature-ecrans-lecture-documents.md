---
id: ERP-67
status: todo
context: nafura
kind: sous-lot
parent: ERP-70
priority: P1
assignee: me
gate: me
feature: ecrans-lecture-documents
tags: [sektor, documents, import, ux]
---

# Feature — Écrans lecture de documents

> Le côté demande : brancher les écrans sur le moteur d'ERP-53, forme par forme.
> Epic : `products/sektor-btp/docs/specs/epics/ecrans-lecture-documents/`

## Pourquoi

Sept écrans sont câblés et la moitié ne fait pas ce que son nom annonce : sur la réception BL il n'y
a aucune création, on remplit un formulaire (7 schémas, **6 handlers** — l'écart est la preuve par
le code). Surtout, les documents qui coûtent le plus cher en ressaisie chez un client BTP — facture
fournisseur, offre reçue, pointage — ne sont branchés nulle part.

## Frontière avec ERP-53

**ERP-53 offre le moteur, ERP-67 porte la demande.** Le modèle (grille, plan de lecture, cascade,
cache, carte des doutes) reste dans `document-reader` ; cette epic n'a volontairement pas
d'`00-ARCHITECTURE.md`. Les lots 3 et 4 sont la **justification** des vagues 2 et 3 d'ERP-53 : sans
écran demandeur, sa propre règle les interdit.

## Inventaire (vérifié dans le code)

**Câblés (7)** : clients, fournisseurs, employés, articles, ouvrages (liste) · lots de chantier
(arbre) · réception BL (tête + lignes, `form.patchValue`, sans handler).
**Hors smart-import** : bordereau d'étude (chemin propre), CPS (ERP-64), atelier `doc-extractor`.
**Candidats** : facture fournisseur, offre fournisseur reçue, accusé de commande, cautions / OS
(vague 2) · pointage, comparatif fournisseurs (vague 3) · reprise comptable (servie dès la vague 1).
Détail et chemins : epic §2.

## Lots (à découper en `kind: task`)

| # | Lot | Dépend |
|---|-----|--------|
| 0 | Forme `liste` — 5 écrans + reprise comptable | ERP-53 lot 4 |
| 1 | Forme `arbre` — lots de chantier + bordereau | ERP-53 lot 4 |
| 2 | Forme `tête + lignes` — BL, facture, offre, accusé | ERP-53 vague 2 |
| 3 | Forme `matrice` — pointage, comparatif fournisseurs | ERP-53 vague 3 |

Toute cette epic est **en aval** du moteur : rien ne démarre avant ERP-53 lot 4. Son travail utile
d'ici là est le PLAN lui-même, qui dit à ERP-53 quelles formes sont réclamées et par qui.

## Bloquant avant découpage

**Q1 tranchée le 11/08** : `document-reader` — slug d'epic, `feature:` PM, capability. Docs
renommées ; **le code attend le lot 0 d'ERP-53** (38 fichiers, dans le déménagement déjà prévu).
Côté UI, **un libellé par geste** et non un nom produit : « Importer depuis un fichier » /
« Remplir depuis la facture » / « Charger le bordereau ». Le **nom de marque** — affiché au moment du
compte rendu — est reporté et n'entrera jamais dans le code.

**Écarté après vérification** — il n'y a pas deux écrans de facture fournisseur.
`pages/achats/factures-fournisseur/` ne contient que `ff-api.service.ts` et `ff.mapper.ts`, sans page
ni route ; l'unique écran est `/finance/factures-fournisseurs`. Reste une dette de placement (service
sous `pages/achats/` consommé par sept endroits) — non bloquante, traitée au lot 2.

De même, le rapprochement facture ↔ commande ↔ réception **existe** (`MatchingService`, tolérance,
`blocksInvoiceValidation`). La lecture l'alimente, elle ne le refait pas. Reste à décider s'il se
déclenche automatiquement à la lecture ou à la main (epic Q2).

## Critères de validation

- Aucun écran câblé ne perd de fonctionnalité pendant la bascule.
- La bascule se mesure par forme : lignes créées pour `liste`, étalon des 703 articles pour `arbre`.
- `ff-api.service` ne vit plus sous `pages/achats/` à la fin du lot 2.
- Aucun service de la feature plateforme ne dépend d'une API ERP (règle `SMART_IMPORT.md`).
- Le mode `remplir` distingue visuellement ce que l'utilisateur a saisi de ce qui a été lu.

## Enfants

_(aucun encore — PLAN à valider, puis découpage)_

## Journal

```
11/08  spec · epic ecrans-lecture-documents créé (00-PLAN + 00-PROGRESS)
11/08  inventaire · 7 écrans câblés / 6 handlers · candidats situés par vague
11/08  correctif · pas de doublon facture fournisseur (1 écran finance + services mal placés
       sous pages/achats) · MatchingService existe déjà · ancien lot 0 supprimé, lots 0-3
```
