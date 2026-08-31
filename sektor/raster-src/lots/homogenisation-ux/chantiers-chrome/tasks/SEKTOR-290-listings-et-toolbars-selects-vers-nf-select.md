---
id: SEKTOR-290
status: review
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [homog, chantiers]
---

# listings et toolbars selects vers nf-select

> Native `<select>` → `nf-select` sur listings / toolbars / drawer / lot dialog listés au plan.

## Étapes

- [x] chantiers-listing filtres status/alerte/tri
- [x] attachement-listing filtre status
- [x] journal-chantier filtre + create type
- [x] gantt-toolbar chantier/période/granularité
- [x] activite-drawer parent/zone/noeud
- [x] lot-form-dialog parent/target/unité

## Journal

```
31/08 12:01  posée
31/08 12:xx  status → doing
31/08 12:xx  selects chrome livrés
31/08 12:17  status → review
```

## Rapport de livraison

### Fichiers

- `sektor/sources/web/app/chantiers/chantiers-listing/chantiers-listing.page.ts`
- `sektor/sources/web/app/chantiers/attachements/attachement-listing/attachement-listing.page.ts`
- `sektor/sources/web/app/chantiers/journal/journal-chantier.page.ts`
- `sektor/sources/web/app/chantiers/planning/components/gantt-toolbar/gantt-toolbar.component.ts`
- `sektor/sources/web/app/chantiers/planning/components/activite-drawer/activite-drawer.component.ts`
- `sektor/sources/web/app/chantiers/components/lot-form-dialog/lot-form-dialog.component.ts`

### AC

- AC-9 / AC-13 — 0 `<select>` natif sur le périmètre listé

### Hors périmètre (non touchés ici)

- `chantier-edit` status select ; `avancement-saisie` add-line select (hors liste SEKTOR-290)
