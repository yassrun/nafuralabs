---
id: SEKTOR-123
status: done-me
context: nafura
type: bug
agent_type: exec
priority: P2
assignee: agent
gate: none
blocked_by: [SEKTOR-115]
tags: [etudes, qa-parcours]
---

# Bouton Partager du dossier etude

> Partager reste disabled tout le parcours (cree, chiffre, valide). QA 20/08 DE-0012.

Repro QA 20/08 DE-0012 : Partager disabled du create jusqu’à Validée. Header a déjà une règle « étape Coût verte ».

## Étapes

- [x] Diagnostiquer pourquoi `Partager` reste disabled (gate, guest, permission).
- [x] Un chargé d’étude owner peut ouvrir le dialog Partager dès que le dossier existe (ou dès l’étape Coût si c’est la règle déjà écrite) — plus « always disabled ».
- [x] Si le blocage est une décision produit (portail invité) : `blocked` + ligne inbox, ne pas inventer le portail.
- [x] Preuve : bouton enabled + dialog s’ouvre, ou journal + inbox si hors périmètre.

## Journal

```
20/08 21:12  posée
20/08 21:33  status → doing
20/08 21:35  diag : canShare=coutEtapeVerte — gates informatives consultation → toujours false
20/08 21:40  e2e vert : Partager enabled + dialog Partager le dossier
20/08 21:34  status → review
20/08 21:40  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `peutPartager` = dossier existe. Portail invité déjà branché (`ShareGuestLinkDialog`). Plus `coutEtapeVerte`.
critères prouvés     Bouton Partager enabled à l’étape Coût ; clic ouvre « Partager le dossier ».
décidé seul          Enable dès que le dossier a un id (pas « Coût verte ») : la gate consultation informative empêchait le vert en permanence.
écarts / dette       Aucun — pas inbox : le portail existe déjà.
