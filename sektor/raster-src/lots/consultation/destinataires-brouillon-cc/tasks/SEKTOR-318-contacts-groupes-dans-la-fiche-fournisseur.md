---
id: SEKTOR-318
status: done
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [SEKTOR-317]
tags: [ui]
---

# Contacts groupés dans la fiche fournisseur

> Contacts dans la fiche fournisseur (Informations), pas un onglet. Destinataires groupés sous le fournisseur.

## Étapes

- [x] Retirer l’onglet Contacts ; bloc sur Informations
- [x] Retirer les champs contact principal dupliqués
- [x] Destinataires : contacts listés sous le fournisseur
- [x] Canvas / contrat AC-5 + e2e

## Preuves attendues

```
node sektor/e2e/scripts/verify-consultation-contact-write-through.mjs
```

Mode B owner.

## Journal

```
04/09 16:40  posée
04/09 16:40  status → doing
04/09 16:48  contacts dans Informations ; destinataires groupés ; e2e PASS
04/09 16:43  status → done
```

## Rapport de livraison

Plus d’onglet Contacts : le bloc est sur **Informations** de la fiche fournisseur. Champs « contact principal » nom/tel/e-mail retirés (doublon). `?tab=contacts` ancre le bloc. Sur la consultation, les personnes sont listées **sous** le fournisseur. `verify-consultation-contact-write-through.mjs` OK.
