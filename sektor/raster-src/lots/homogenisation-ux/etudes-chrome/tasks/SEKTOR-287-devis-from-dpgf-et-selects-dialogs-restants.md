---
id: SEKTOR-287
status: review
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [homog, etudes]
---

# devis-from-dpgf et selects dialogs restants

> Annuler devis → nf-button ; selects dialogs dossiers → nf-select.

## Étapes

- [x] devis-from-dpgf Annuler + Créer → nf-button
- [x] sous-detail / create-missing-item / bordereau-noeud / postes-orphelins → nf-select

## Journal

```
31/08 12:01  posée
31/08 12:02  status → doing
31/08 12:25  livré devis + dialogs selects
31/08 12:11  status → review
```

## Rapport de livraison

### Fait
- `devis-from-dpgf.page.ts` : Annuler secondary + Créer primary (`nf-button`) ; styles `.btn` maison retirés.
- Dialogs : `sous-detail-dialog`, `create-missing-item-dialog`, `bordereau-noeud-dialog`, `postes-orphelins-dialog` — tous les `<select>` → `nf-select` + options `NfSelectOption[]`.
- MatDialog conservé (hors v1 CONTRAT).

### Preuves
- Grep paths touchés : button=0 select=0.
- `node raster/t.mjs check` OK.

### Hors périmètre (dette)
- `capitalisation-panel` / `rattrapage-panel` selects (pas dialogs chrome listés).
- consultation-decompo rows encore `<button>` sémantiques liste (hors task).
