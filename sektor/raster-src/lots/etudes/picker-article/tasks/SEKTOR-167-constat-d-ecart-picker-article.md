---
id: SEKTOR-167
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: none
tags: [sektor, ux, catalogue]
---

# Constat d'écart picker article

> Après review 142-144. Trancher livré vs CONTRAT (AC-12 preset vs AC-1 filtre). Ne pas recoder les AC-n sauf si le contrat avait tort. Dette inbox hors v1.

## Étapes

- [x] Lire CONTRAT + DECISIONS § 23/08 + rapports 142/143/144
- [x] Trancher AC-12 preset vs AC-1 filtre (contrat se contredisait)
- [x] Trancher famille profondeur (enfants vs arbre entier)
- [x] Patch explicite AC-1 + AC-12 ; DECISIONS une phrase
- [x] Dette inbox hors v1 : inchangée, pas d’AC nouveau

## Journal

```
23/08 18:32  posée
23/08 18:32  status → doing
23/08 18:40  constat : contrat se contredisait (AC-12 preset + AC-1 filtre = dump DPU)
23/08 18:40  patch AC-1 + AC-12 : preset ≠ filtre déclencheur ; chip humain oui
23/08 18:40  famille : CONTRAT « enfants » = directs (livré) — pas trop promis, rien
23/08 18:40  DECISIONS § Ouverture : une phrase pour suivre le gel
23/08 18:40  hors v1 / inbox 144 : dette, CONTRAT inchangé
23/08 18:34  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      CONTRAT AC-1 + AC-12 re-gelés (preset nature ≠ déclencheur). DECISIONS § 23/08 Ouverture : une phrase. Canvas décisions UX aligné.
critères prouvés     n/a (constat, pas exec). AC-1…14 encore gelés — contradiction AC-1/AC-12 tranchée. QA 145 joue ce gel.
décidé seul          Famille « un parent ramène les enfants » = enfants **directs** (livré). CONTRAT ne promettait pas les petits-enfants → ni patch, ni dette.
écarts / dette       Inbox déjà là (sorties/pertes/inventaire, import BL, filtres listing). Hors v1 inchangé. Pas de nouveau AC. Livré 142-144 aligné sur le contrat patché.
