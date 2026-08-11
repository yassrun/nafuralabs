---
id: ERP-41
status: done
context: nafura
kind: task
priority: P1
assignee: agent
gate: none
parent: ERP-40
feature: qa-local-auth-seed
sprint: 2026-W33
tags: [docs, qa]
---

# QA local — Lot 1 · Contrat + docs agents

> Figé naming ; playbook CLAUDE + rule Cursor QA (même user, `start:erp:cursor` only).

## Critères d'acceptation
- [x] Naming figé : tenant `qa-local`, owner `qa@nafuralabs.local`
- [x] `.cursor/rules/cursor-qa-browser.mdc` pointe vers `qa@…`
- [x] `products/sektor-btp/README.md` Mode B mis à jour
- [x] `CLAUDE.md` / epic PROGRESS alignés
- [x] `cursor.qa@…` marqué déprécié dans les docs

## Journal
```
10/08 20:10  démarré avec ERP-40
10/08 20:20  docs + rule + README + CLAUDE à jour
11/08 10:37  check progress · review → done (humain)
```
