---
id: ERP-45
status: review
context: nafura
kind: task
priority: P1
assignee: agent
gate: none
parent: ERP-40
feature: qa-local-auth-seed
sprint: 2026-W33
tags: [ops, qa, cli]
---

# QA local — Lot 5 · CLI `qa-token`

> Une commande → Bearer + `X-Tenant-Id` pour API sans browser.

## Critères d'acceptation
- [x] Script `toolchain/ops/qa-token.sh` (ou équivalent)
- [x] Appelle `POST …/cursor-session` et affiche token + tenantId
- [x] Documenté dans README Mode B / rule Cursor QA

## Journal
```
10/08 20:10  créé · après Lot 3
10/08 20:20  qa-token.sh + docs
```
