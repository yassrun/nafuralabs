---
id: SEKTOR-316
status: done
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [SEKTOR-315]
tags: [ui]
---

# UI brouillon onglet contacts preuves e2e

> Ajouter local, cases contacts, Enregistrer, onglet Contacts fiche, e2e 279/280/CC.

## Étapes

- [x] Fiche consultation : brouillon + save
- [x] Onglet Contacts fournisseur + `?tab=contacts`
- [x] i18n FR/EN/AR
- [x] e2e 279, 280, write-through réécrit

## Preuves attendues

```
node sektor/e2e/scripts/verify-consultation-contact-write-through.mjs
node sektor/e2e/scripts/verify-consultation-rfq-279.mjs
node sektor/e2e/scripts/verify-consultation-rfq-280.mjs
```

Mode B owner.

## Journal

```
04/09 13:19  posée
04/09 14:06  UI brouillon + cases + Enregistrer ; onglet Contacts fiche
04/09 14:06  e2e 279/280/CC PASS Mode B
04/09 14:02  status → doing
04/09 14:02  status → done
```

## Rapport de livraison

Ajouter = brouillon local. Cases `PartnerContact` (To puis CC). Enregistrer → PUT. Lien `/achats/fournisseurs/{id}?tab=contacts`. Onglet Contacts sur la fiche fournisseur. i18n FR/EN/AR. Preuves Mode B owner : write-through (brouillon+CC), 279, 280 — OK.
