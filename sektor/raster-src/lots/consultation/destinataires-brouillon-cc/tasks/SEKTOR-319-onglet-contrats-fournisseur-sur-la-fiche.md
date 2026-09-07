---
id: SEKTOR-319
status: done
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [SEKTOR-318]
tags: [ui]
---

# Onglet contrats fournisseur sur la fiche

> Contacts restent l’onglet Contacts. Les contrats fournisseur ont leur propre onglet sur la fiche.

## Étapes

- [x] Rétablir l’onglet Contacts (sortir les personnes d’Informations)
- [x] Onglet Contrats : liste filtrée, vide, CTA nouveau contrat
- [x] `?fournisseurId=` sur création contrat + `GET ?fournisseurId=`
- [x] Contrat / canvas / e2e AC-5 corrigés

## Preuves attendues

```
node sektor/e2e/scripts/verify-consultation-contact-write-through.mjs
```

Mode B owner.

## Journal

```
04/09 16:50  posée
04/09 16:51  status → doing
04/09 16:55  correction : contact ≠ contrat ; onglet Contrats sur la fiche
04/09 16:58  status → done
```

## Rapport de livraison

L’onglet Contacts est rétabli (personnes + Principal). Un onglet **Contrats** liste les contrats du partenaire (`GET /contrats-fournisseur?fournisseurId=`), avec état vide et CTA vers `/achats/contrats/new?fournisseurId=`. AC-5 / canvas / e2e ne groupent plus les contacts dans Informations.
