---
id: SEKTOR-291
status: review
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [homog, chantiers]
---

# edit et avancement-saisie nf-action-bar sticky

> Remplace `nav-actions` / `saisie-page__sticky-bar` par `nf-action-bar sticky` ; lots-tab linklike → ghost.

## Étapes

- [x] chantier-edit → `nf-action-bar` sticky
- [x] avancement-saisie → `nf-action-bar` sticky (+ scss sticky maison retiré)
- [x] chantier-lots-tab collapse/expand → `nf-button` ghost

## Journal

```
31/08 12:01  posée
31/08 12:xx  status → doing
31/08 12:xx  action-bar sticky + lots linklike livrés
31/08 12:17  status → review
```

## Rapport de livraison

### Fichiers

- `sektor/sources/web/app/chantiers/edit/chantier-edit.page.ts`
- `sektor/sources/web/app/chantiers/avancements/avancement-saisie/avancement-saisie.page.ts`
- `sektor/sources/web/app/chantiers/avancements/avancement-saisie/avancement-saisie.page.html`
- `sektor/sources/web/app/chantiers/avancements/avancement-saisie/avancement-saisie.page.scss`
- `sektor/sources/web/app/chantiers/components/chantier-lots-tab/chantier-lots-tab.component.ts`

### AC

- AC-4 sticky `nf-action-bar` ; AC-1/12 linklike → `nf-button` ghost (lots-tab)

### Notes

- Anatomy `ActionBarComponent.sticky` (SEKTOR-284) utilisé tel quel
- Padding bas saisie réduit (plus de barre fixed maison)
