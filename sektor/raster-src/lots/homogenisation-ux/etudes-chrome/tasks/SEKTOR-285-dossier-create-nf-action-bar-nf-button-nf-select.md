---
id: SEKTOR-285
status: doing
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
tags: [homog, etudes]
---

# dossier-create nf-action-bar nf-button nf-select

> Remplace creer__bouton / selects natifs / barre maison par nf-action-bar + nf-button + nf-select.

## Étapes

- [x] nf-button pour IA (ghost/secondary) et actions CPS
- [x] nf-select chargé d’étude + type AO
- [x] nf-action-bar sticky Annuler + Créer (primary)

## Journal

```
31/08 12:01  posée
31/08 12:02  status → doing
31/08 12:15  livré chrome dossier-create
31/08 12:11  status → review
31/08 12:13  status → doing
```

## Rapport de livraison

### Fait
- `dossier-create.page.html/.ts` : 0 `<button>`, 0 `<select>`.
- Barre bas : `nf-action-bar align="right" sticky` — Annuler secondary + Créer primary (AC-3/AC-6).
- IA Accepter/Ignorer (champ et bulk) : ghost / secondary, jamais primary.
- Chargé d’étude + type AO : `nf-select` (AC-13).
- Exempt AC-12 : label « Parcourir » + `<input type="file">` natif.

### Preuves
- Grep path : button=0 select=0 mat-icon=0.
- `node raster/t.mjs check` OK.

### Décisions
- Sticky action-bar (form potentiellement long avec CPS + IA).
- `chargeEtudeUserId` bindé via `?? ''` / `$event || null` pour CVA string de nf-select.
