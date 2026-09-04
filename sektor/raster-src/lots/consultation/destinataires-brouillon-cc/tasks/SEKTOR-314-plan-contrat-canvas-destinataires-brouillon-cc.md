---
id: SEKTOR-314
status: done
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
---

# Plan contrat canvas destinataires brouillon CC

> Plan, contrat et canvas : Ajouter local, Enregistrer, N contacts To+CC, lien fiche Contacts. Write-through cassé.

## Étapes

- [x] `00-PLAN.md` + `CONTRAT.md` AC-1…AC-8
- [x] Canvas `ux/destinataires-brouillon-cc-wireframe.canvas.tsx`
- [x] Amender gel 28/08 + casser write-through dans `DECISIONS-PRODUIT.md`
- [x] Tasks 315 (API) / 316 (UI + e2e)

## Journal

```
04/09 13:19  posée
04/09 13:20  plan + contrat + canvas + gel
04/09 13:19  status → doing
04/09 13:19  status → done
```

## Rapport de livraison

Sous-lot `destinataires-brouillon-cc` : grain 1 fournisseur + N contacts ; persist = PUT ; création contact sur la fiche. Write-through 04/09 matin cassé.
