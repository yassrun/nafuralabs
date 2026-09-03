---
id: SEKTOR-296
status: doing
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
tags: [homog, achats]
---

# selects detail et bc-detail action-bar

> 2 lignes max.

## Étapes

- [x] consultation-detail contact select → nf-select
- [x] fournisseur-detail attestation select → nf-select ; drop `btn btn--*` sur nf-button
- [x] bc-detail réception → nf-action-bar Annuler/Save
- [x] chip-btn : laissé (déjà nf-button ; ghost casserait chips listing)

## Journal

```
31/08 12:01  posée
31/08 12:02  status → doing
31/08 12:05  livré chrome AC-3 / AC-13 Achats résiduel
31/08 12:05  status → review
31/08 12:13  status → doing
```

## Rapport de livraison

ce qui a changé
- `consultation-detail.page.html` + `.ts` — contact multi → `nf-select` + `contactSelectOptions()` ; styles `<select>` retirés
- `fournisseur-detail.page.html` + `.ts` — type attestation → `nf-select` (`attestationTypeOptions`) ; `btn` / `btn--primary` / `btn--sm` / `btn--danger` retirés des `nf-button` ; ordre Annuler → Enregistrer (AC-6)
- `bc-detail.page.html` + `.ts` — `bc-rec-form__actions` → `nf-action-bar align="right"` ; Annuler secondary puis Valider primary (+ loading)

preuves exécutées
- `rg "<select" sektor/sources/web/app/achats --glob "*.html"` → 0
- `rg "bc-rec-form__actions|btn btn--" sektor/sources/web/app/achats` → 0 (HTML)
- `node raster/t.mjs check` — 0 erreur
- script `verify-homog-achats.mjs` → SEKTOR-297 (qa)

décidé seul
- chip-btn listings Achats : déjà `nf-button` primary/secondary ; pas remplacé par ghost (casse état actif chips au-dessus de `nf-entity-listing`) — dette CONTRAT hors v1

écarts / dette
- CSS legacy `.btn` / `.btn--primary` encore dans styles inline `fournisseur-detail` (plus référencé en HTML)
- chip-btn class sur listings (demande, bc, ao, contrat, fournisseur)
