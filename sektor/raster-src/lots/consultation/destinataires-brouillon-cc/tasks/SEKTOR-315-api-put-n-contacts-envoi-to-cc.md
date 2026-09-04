---
id: SEKTOR-315
status: done
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [SEKTOR-314]
tags: [api]
---

# API PUT N contacts envoi To CC

> Join contacts, PUT replace destinataires, drop write-through, send To+CC.

## Étapes

- [x] Changelog 009 + entité join
- [x] `contactIds` ; refus 0 contact e-mail
- [x] `PUT /destinataires`
- [x] Envoi `sendWithAttachments` To+CC
- [x] Tests unitaires

## Preuves attendues

```
cd sektor/sources/backend && ./gradlew :sektor:achats:test --tests ma.nafura.achats.service.ConsultationAchatServiceTest
```

## Journal

```
04/09 13:19  posée
04/09 13:19  status → doing
04/09 14:05  PUT + join + To/CC ; flush après delete contacts (uq destinataire/contact)
04/09 14:05  tests unitaires PASS
04/09 14:02  status → done
```

## Rapport de livraison

`PUT /api/v1/consultations-achat/{id}/destinataires` remplace les destinataires non envoyés. Join `consultation_achat_destinataire_contacts` (position 0 = To). POST unitaire sans write-through : 0 e-mail → `sans_email`. Envoi `sendWithAttachments(To, CC)`. Flush après delete des liens pour éviter le 500 unique `(destinataire_id, contact_id)` au réenregistrement. `ConsultationAchatServiceTest` BUILD SUCCESSFUL.
