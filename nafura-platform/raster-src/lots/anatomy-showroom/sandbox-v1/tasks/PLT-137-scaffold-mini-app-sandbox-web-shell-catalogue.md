---
id: PLT-137
status: done
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [PLT-136]
tags: [anatomy, sandbox]
---

# Scaffold mini-app sandbox-web + shell catalogue

> Angular serve, alias @platform, nav Archetypes|Components, routing catalogue

## Étapes

- [x] Créer `nafura-platform/sources/sandbox-web` (Angular app, port 4300)
- [x] Alias tsconfig `@platform/*` → `../web/*`
- [x] Shell showroom : sidebar Archetypes | Components (configurable)
- [x] Route `/` = catalogue
- [x] `npm start` → http://127.0.0.1:4300 ; zéro auth

## Journal

```
07/09 11:18  posée
07/09 11:25  status → doing
07/09 11:48  app up on :4300
07/09 15:07  status → done
```

## Rapport de livraison

Mini-app `sources/sandbox-web` avec sidebar configurable (`src/app/nav/showroom-nav.config.ts`) : menus **Archetypes** + **Components**. Build + `ng serve` OK.
