---
id: ERP-43
status: done
context: nafura
kind: task
priority: P0
assignee: agent
gate: none
parent: ERP-40
feature: qa-local-auth-seed
sprint: 2026-W33
tags: [backend, auth, qa]
---

# QA local — Lot 3 · Auto-auth unifié → `qa@…`

> Pointer cursor-session / env vers `qa@…` ; déprécier `cursor.qa`.

## Critères d'acceptation
- [x] Default `NAFURA_DEV_CURSOR_AUTH_EMAIL` = `qa@nafuralabs.local`
- [x] `CursorAuthProperties` / `application.yml` alignés
- [x] `dev-staging-local.sh` écrit l’email (+ tenant id si fixe)
- [x] Alias `cursor.qa@…` redirigé ou documenté déprécié
- [x] Front `start:erp:cursor` se connecte comme `qa@…` sur `qa-local`

## Journal
```
10/08 20:10  démarré
10/08 20:20  defaults + remap alias + prefer tenant key qa-local
11/08 10:37  check progress · review → done (humain)
```
