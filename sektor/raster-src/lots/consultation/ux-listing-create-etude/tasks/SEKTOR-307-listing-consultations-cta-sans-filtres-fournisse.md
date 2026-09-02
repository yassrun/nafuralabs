---
id: SEKTOR-307
status: review
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-306]
tags: [ui, achats]
---

# Listing consultations : CTA sans ++, filtres fournisseur articles statut, lignes visibles

> CTA header = icône plus + libellé sans +. Filtres nf-entity-listing : statut (enum), fournisseur (lookupKey), article (lookupKey items), lien étude. API query. Tableau headers+rows si total>0.

## Étapes

- [x] CTA i18n « Nouvelle consultation » (plus d’icône + libellé `+ Consultation`)
- [x] Filtres statut / fournisseur / article / lien
- [x] GET listing : query `statut`, `fournisseurId`, `articleId`, `lien`, `search`
- [x] Wrapper listing en flex (lignes visibles)

## Preuves attendues

- `node sektor/e2e/scripts/verify-consultation-ux-listing-create-etude.mjs`

## Journal

```
02/09 13:43  posée
02/09 14:10  listing + API filtres + CTA ; preuve UX OK
02/09 18:35  status → doing
02/09 18:35  status → review
```

## Rapport de livraison

### Ce qui a changé

- CTA listing : `achats.consultation.list.cta` = « Nouvelle consultation ».
- Filtres : statut, fournisseur (`lookupKey: fournisseurs`), article (`lookupKey: items`), lien étude.
- API `GET /api/v1/consultations-achat` accepte `fournisseurId`, `articleId`, `statut`, `lien`, `search`.
- `.cs-list` flex pour que `nf-entity-listing` n’ait plus une hauteur 0.

### Preuves exécutées

- `verify-consultation-ux-listing-create-etude.mjs` → PASS source + API + browser listing.

### Décidé seul

- Libellé CTA sans « + » pour ne plus empiler l’icône anatomy `plus`.
