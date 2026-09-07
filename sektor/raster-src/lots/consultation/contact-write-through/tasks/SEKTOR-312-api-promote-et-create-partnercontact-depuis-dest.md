---
id: SEKTOR-312
status: done
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [SEKTOR-311]
tags: [api]
---

# API promote et create PartnerContact depuis destinataire

> POST destinataire : 0 contact e-mail → promote `partners.email` ou create `contactNom`/`contactEmail` (`is_primary`). Pas d’e-mail orphelin.

## Étapes

- [x] DTO `contactNom` / `contactEmail`
- [x] `createContactWriteThrough` + binding inchangé si contacts existants
- [x] Tests unitaires promote / write-through / invalide / ignore N contacts

## Preuves attendues

```
cd sektor/sources/backend && ./gradlew :sektor:achats:test --tests ma.nafura.achats.service.ConsultationAchatServiceTest
```

## Journal

```
04/09 11:05  posée
04/09 11:20  API + tests unitaires
04/09 11:34  status → doing
04/09 11:34  status → done
```

## Rapport de livraison

API : `createContactWriteThrough` — promote `partners.email` ou POST `contactNom`/`contactEmail` → `PartnerContact` `is_primary`. Tests unitaires PASS (`ConsultationAchatServiceTest`).

preuves exécutées
`./gradlew :sektor:achats:test --tests ma.nafura.achats.service.ConsultationAchatServiceTest`

décidé seul
E-mail invalide = 4xx `email_invalide`. Payload write-through ignoré si contacts déjà présents.

écarts / dette
Pas de synchro fiche fournisseur hors consultation.
