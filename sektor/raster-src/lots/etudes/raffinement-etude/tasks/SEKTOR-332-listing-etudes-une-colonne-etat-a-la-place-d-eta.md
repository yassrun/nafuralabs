---
id: SEKTOR-332
status: done
context: nafura
type: feature
agent_type: exec
priority: P2
assignee: agent
tags: [ui, etudes]
---

# Listing etudes — une colonne Etat a la place d Etape et Statut

> Fusion listing : etape pendant le travail, badge statut seulement quand il n est plus deductible (validation, convertie, perdu).

## Étapes

- [x] Fusionner Étape + Statut en une colonne État (étape pendant le travail, statut après soumission)
- [x] Tests `labelEtatListing` / `variantEtatListing`
- [x] Vérifier le listing Mode B (headers + cellules)

## Journal

```
09/09 13:30  posée
09/09 13:30  status → doing
09/09 13:30  status → doing
09/09 13:32  status → doing
09/09 13:45  status → done
```

## Rapport de livraison

Listing Études : une colonne **État** à la place d’Étape + Statut. Pendant le travail → nom d’étape (`Cadrage & documents`, `Chiffrage`) ; après soumission → statut (`Convertie`, `En validation`…). Plus de `n/4`. Vérifié Mode B : headers `État` seuls, cellules Convertie / Cadrage / Chiffrage. Tests `dossier-status.util.spec.ts` 3/3. `node raster/t.mjs check` : 13 erreurs préexistantes hors SEKTOR-332.

