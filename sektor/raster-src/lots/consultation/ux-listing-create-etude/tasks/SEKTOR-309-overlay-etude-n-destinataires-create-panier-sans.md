---
id: SEKTOR-309
status: review
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-308]
tags: [ui, etudes]
---

# Overlay étude : N destinataires, create panier sans fournisseur unique

> Liste overlay : destinataires + k/n, plus le fournisseur unique. Create overlay = article courant dans le panier + lien étude, 0 champ fournisseur obligatoire. Flag CONSULTE hors.

## Étapes

- [x] Liste/détail : `destinatairesLabel` + k/n devis
- [x] Create overlay : panier article courant + `dossierEtudeId`, pas de fournisseur
- [x] Statuts RFQ (Préparation / En attente / Partielle / Complète)

## Preuves attendues

- `node sektor/e2e/scripts/verify-consultation-achat-139.mjs`

## Journal

```
02/09 13:43  posée
02/09 14:10  overlay N destinataires ; 139 OK
02/09 18:35  status → doing
02/09 18:35  status → review
```

## Rapport de livraison

### Ce qui a changé

- Overlay : destinataires (noms + count), avancement k/n, plus de fournisseur unique.
- Create overlay : POST panier + lien étude. Destinataires sur la fiche Achats.

### Preuves exécutées

- `verify-consultation-achat-139.mjs` → overlay liées + create sans fournisseur unique.

### Décidé seul

- Flag CONSULTÉ / panneau `ConsultationEtude` hors.
