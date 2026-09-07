---
id: PLT-137
status: done
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [PLT-136]
tags: [ui]
---

# Composant nf-screen et fil listing

> Anatomy : nf-screen compose shell+header. Fil visible sur listing. Helper listing/detail.

## Étapes

- [x] `nf-screen` anatomy : slots header / breadcrumbs / body ; compose shell + header
- [x] Fil listing : plus de masquage `length > 1`
- [x] Helper templates ConfigDrivenListing / Detail / Dashboard / MasterSlave

## Journal

```
04/09 17:37  posée
04/09 17:45  status → doing
04/09 18:08  status → done
```

## Rapport de livraison

`nf-screen` (`ScreenComponent`) compose `nf-page-shell` + `nf-page-header`. Fil listing affiché dès `breadcrumbs.length > 0`. Helpers listing/detail/dashboard/master-slave importent `ScreenComponent`. Validation : `ng build` development OK.
