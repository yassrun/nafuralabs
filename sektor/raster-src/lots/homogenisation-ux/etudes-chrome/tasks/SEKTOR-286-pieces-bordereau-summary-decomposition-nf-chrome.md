---
id: SEKTOR-286
status: review
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [homog, etudes]
---

# pieces bordereau summary decomposition nf-chrome

> 0 raw button / mat-icon sur pieces, arbre, summary, decomposition ; deletes danger.

## Étapes

- [x] pieces-marche → nf-button / nf-icon / nf-select
- [x] bordereau-arbre → nf-button (dont danger delete)
- [x] dossier-summary-header → nf-button
- [x] poste-decomposition-panel → nf-button + nf-select base saisie

## Journal

```
31/08 12:01  posée
31/08 12:02  status → doing
31/08 12:20  livré chrome pieces/arbre/summary/decompo
31/08 12:11  status → review
```

## Rapport de livraison

### Fait
- `pieces-marche` : voies auto/manuel, prop CPS, slots meta, ajout pièce → `nf-button` ; delete doc/slot → `variant="danger"` ; décoratif → `nf-icon` ; type ajout → `nf-select`.
- `bordereau-arbre` : expand/collapse/add/edit/row actions → `nf-button` ; delete → danger + ConfirmDialogService (déjà).
- `dossier-summary-header` : actions Partager / Imprimer / CTA → `nf-button`.
- `poste-decomposition-panel` : edit/copy/delete lignes & cards → `nf-button` ; delete danger ; base saisie ESTIME → `nf-select`.
- Mat* modules retirés des imports standalone concernés.

### Preuves
- Grep sur les 4 chemins : button=0 select=0 mat-icon=0.
- Exempt AC-12 : KPI anomalies (`div role="button"`) ; labels file input pièces.

### Décisions
- Voies Automatique/Manuel : `nf-button` primary quand actif, secondary sinon (pas de toggle anatomy dédié).
- Icones arbre Material (`unfold_*`, `subdirectory_arrow_right`) via `nf-button` sans lucide ; lucide pour pencil/plus/trash/copy.
