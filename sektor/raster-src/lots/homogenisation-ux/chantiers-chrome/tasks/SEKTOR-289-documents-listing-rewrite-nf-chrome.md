---
id: SEKTOR-289
status: review
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [homog, chantiers]
---

# documents-listing rewrite nf-chrome

> Upload CTA on `nf-page-header`, filtres/pagination/tabs anatomy, row actions `nf-button`, ConfirmDialogService rename/delete.

## Étapes

- [x] CTA upload → `nf-page-header` `primaryAction`
- [x] Filtres enum → `nf-select` ; tabs → `nf-tabs` ; pagination → `nf-pagination`
- [x] link-button → `nf-button` ghost ; row actions → `nf-button` (+ danger delete)
- [x] ConfirmDialogService.prompt / confirm pour rename/delete

## Journal

```
31/08 12:01  posée
31/08 12:02  status → doing
31/08 12:xx  chrome documents-listing livré
31/08 12:17  status → review
```

## Rapport de livraison

### Fichiers

- `sektor/sources/web/app/chantiers/documents/documents-listing/documents-listing.page.ts`

### AC couverts

- AC-2 (CTA create/upload header), AC-5 (delete danger + ConfirmDialog), AC-9/10/13 (filtres `nf-select`), AC-12 (boutons feature → `nf-button`), tabs/`nf-pagination`

### Exempt documentés (AC-12)

- `folder-card` / `recent-doc` / `document-title` : cartes sémantiques cliquables (pas CTA chrome)
- `<input type="file">` natif (exempt contrat)

### Décisions

- `pageSize` signal défaut 50 (options 25/50/100 via `nf-pagination`) ; rename via `ConfirmDialogService.prompt`
- Preview close / upload close : `nf-button` ghost icon `x`
