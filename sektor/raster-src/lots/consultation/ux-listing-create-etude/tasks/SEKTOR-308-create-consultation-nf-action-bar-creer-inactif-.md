---
id: SEKTOR-308
status: review
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-307]
tags: [ui, achats]
---

# Create consultation : nf-action-bar, Créer inactif tant que panier vide

> Homog AC-3/AC-6. Panier d abord (RFQ AC-1). Destinataires sur la fiche, pas sur /new.

## Étapes

- [x] `nf-action-bar` Annuler + Créer
- [x] Créer disabled tant que panier vide
- [x] Pas de champ fournisseur sur `/new`

## Preuves attendues

- `node sektor/e2e/scripts/verify-consultation-ux-listing-create-etude.mjs`

## Journal

```
02/09 13:43  posée
02/09 14:10  create nf-action-bar + canCreate ; preuve browser OK
02/09 18:35  status → doing
02/09 18:35  status → review
```

## Rapport de livraison

### Ce qui a changé

- `/achats/consultations/new` : Retour ghost, panier, `nf-action-bar` (Annuler / Créer).
- `canCreate` = panier ≥ 1. Créer inactif sinon.
- Destinataires toujours sur la fiche, pas sur `/new`.

### Preuves exécutées

- `verify-consultation-ux-listing-create-etude.mjs` → PASS create (Créer disabled + action-bar).

### Décidé seul

- Hint explicite : destinataires après création sur la fiche.
