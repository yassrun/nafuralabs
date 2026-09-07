---
id: PLT-138
status: done
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [PLT-137]
tags: [ui]
---

# Cadre nf-screen sur les 5 modules

> Pages catalogue, études, achats, ventes, chantiers via `nf-screen`. Preuve Mode B.

## Étapes

- [x] Pages des 5 modules : `nf-screen` à la place de shell + header
- [x] Fiches : onglets dans le body
- [x] Preuve Mode B owner (source + UI listing/fiche)

## Journal

```
04/09 17:37  posée
04/09 18:08  status → doing
04/09 18:08  status → done
```

## Rapport de livraison

Cadre posé sur catalogue / études / achats / ventes / chantiers. Hors v1 nommé : dossier étude create/detail, budget, saisie avancement, magasin, scanner, guest. Chips listing restent dans le body. Preuve : `node sektor/e2e/scripts/verify-nf-screen-cadre.mjs` (source + UI fournisseurs / dossiers / chantiers + fiche). `ng build` development OK.
