---
id: SEKTOR-306
status: done-agent
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: me
tags: [consultation]
---

# Consultation UX : CTA listing sans ++, filtres fournisseur / articles / statut, create nf-action-bar (Créer inactif tant que panier vide), overlay étude aligné RFQ N destinataires

> Humain : passer direct à l'impl. Plan court, pas de canvas.

## Étapes

- [x] 00-PLAN + preuves
- [x] Tasks 307–310 déjà posées

## Journal

```
02/09 13:42  posée
02/09 13:42  status → doing
02/09 14:10  humain skip spec/canvas → plan court + preuves e2e
02/09 18:35  status → done-agent
```

## Rapport de livraison

### Ce qui a changé

- `00-PLAN.md` : CTA, filtres, create `nf-action-bar`, overlay N destinataires. `/new` = panier ; destinataires = fiche.
- Preuves : `verify-consultation-ux-listing-create-etude.mjs` + `verify-consultation-achat-139.mjs`.

### Décidé seul

- Pas de canvas : humain a demandé l'impl directe.
- Flag CONSULTÉ hors périmètre.
