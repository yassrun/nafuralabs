---
id: SEKTOR-293
status: doing
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
tags: [homog, catalogue]
---

# etat-stocks tree console line-editors nf-chrome

> etat-stocks nf-select ; tree/console/line-editors nf-button (layout inchangé).

## Étapes

- [x] etat-stocks : 4 `<select>` → `nf-select` (enums + listes filtre)
- [x] famille-tree : liens/row-actions → `nf-button` ; parent → `nf-select`
- [x] catalogue-console : tabs → `nf-button`
- [x] line-editors perte/transfert/retour/inventaire : pick → `nf-button`

## Journal

```
31/08 12:01  posée
31/08 12:02  status → doing
31/08 12:15  chrome nf-select / nf-button catalogue
31/08 12:09  status → review
31/08 12:13  status → doing
```

## Rapport de livraison

### Ce qui a changé

- `etat-stocks.page.ts` — filtres locationType / location / famille / stockStatus en `nf-select` (AC-13 ; enums AC-9).
- `famille-tree.page.ts` — collapse/expand + actions ligne en `nf-button` ; parent en `nf-select` (AC-12/13).
- `catalogue-console.page.html` — onglets Candidats/Éditions en `nf-button`.
- line-editors `perte` / `transfert` / `retour` / `inventaire` — trigger picker article en `nf-button` fullWidth (garde `data-testid="article-picker-open"`).

### Preuves exécutées

- Grep cible : 0 `<select>` / 0 `<button>` feature sur fichiers listés (hors exempt console card).
- Wiring statique ; preuve e2e Mode B = SEKTOR-295.

### Décidé seul

- Emplacements / familles etat-stocks restent options locales (déjà chargées) via `nf-select`, pas combobox lookupKey dans cette passe (AC-8 FK typeahead reporté si besoin).

### Écarts / dette

- **Exempt AC-12** : `catalogue-console` cartes candidats = `<button class="cat__card">` sémantique sélection liste (layout carte).
- Hors périmètre : `reception-lines-editor` pick encore `<button>` ; `uom-detail` selects ; `article-picker` dialog interne.
