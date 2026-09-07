---
id: SEKTOR-313
status: done
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [SEKTOR-312]
tags: [ui]
---

# UI champs contact write-through et preuves e2e

> 0 contact : champs nom + e-mail sur la fiche, préremplis depuis `partners.email`. Script write-through + 279 (refus = aucun e-mail).

## Étapes

- [x] Champs `nf-input` + hint + lien fiche
- [x] `verify-consultation-contact-write-through.mjs`
- [x] 279 : refus sans `partners.email`

## Preuves attendues

```
node sektor/e2e/scripts/verify-consultation-contact-write-through.mjs
node sektor/e2e/scripts/verify-consultation-rfq-279.mjs
```

Mode B owner.

## Journal

```
04/09 11:05  posée
04/09 11:25  UI + e2e
04/09 11:34  status → doing
04/09 11:34  status → done
```

## Rapport de livraison

UI : champs nom + e-mail si 0 contact, préremplis après chargement (`destContactsReady`). Hint + lien fiche.

preuves exécutées
`node sektor/e2e/scripts/verify-consultation-contact-write-through.mjs` — PASS AC-1…AC-7 (API + browser)
`node sektor/e2e/scripts/verify-consultation-rfq-279.mjs` — PASS (refus = aucun e-mail ; 2 dest / N contacts API)

décidé seul
279 browser 2 dest : UI add déjà prouvée par write-through ; 279 browser garde le refus sans e-mail.

écarts / dette
Liste contacts sur fiche fournisseur hors périmètre.
