---
kind: epic-progress
app: sektor-btp
slug: ecrans-lecture-documents
raster_feature: ERP-67
updated: 2026-08-11
---

# Progress — Écrans lecture de documents

**Statut :** todo
**Lot courant :** — (PLAN à valider avant découpage)
**Ticket :** ERP-67
**Next :** trancher Q1 (le nom) avant le lot 0 de `document-reader`. Aucun lot d'ERP-67 ne peut
démarrer avant IM lot 4.

## Lots

| # | Lot | Status | Ticket | Dépend |
|---|-----|--------|--------|--------|
| 0 | Forme `liste` | todo | — | IM lot 4 |
| 1 | Forme `arbre` | todo | — | IM lot 4 |
| 2 | Forme `tête + lignes` | todo | — | IM vague 2 |
| 3 | Forme `matrice` | todo | — | IM vague 3 |

## Notes (courtes)

- 11/08 — PLAN rédigé. Inventaire vérifié dans le code : 7 écrans câblés, 6 handlers (le BL n'en a
  pas — il remplit un formulaire, il ne crée rien).
- Pas de `00-ARCHITECTURE.md` ici, par décision : le modèle vit dans `document-reader`.
- 11/08 — **faux doublon écarté** : `pages/achats/factures-fournisseur/` ne contient que deux
  services (`ff-api`, `ff.mapper`), aucune page ni route. L'unique écran est
  `/finance/factures-fournisseurs`. Reste une dette de placement — le service est consommé par sept
  endroits hors de ses pages. Non bloquant, à traiter au lot 2. L'ancien lot 0 disparaît.
- 11/08 — `MatchingService` (achats) fait déjà commande ↔ réceptions ↔ facture, avec tolérance et
  `blocksInvoiceValidation`. La lecture l'alimente, elle ne le refait pas.
- Les lots 2 et 3 sont la **justification** des vagues 2 et 3 de `document-reader`. Sans eux, la règle
  « une forme n'entre que quand un écran la réclame » les interdit.
- Q1 (le nom) doit être tranchée avant le lot 0 de `document-reader` : c'est le seul renommage à coût
  nul, le moteur déménage de toute façon.
