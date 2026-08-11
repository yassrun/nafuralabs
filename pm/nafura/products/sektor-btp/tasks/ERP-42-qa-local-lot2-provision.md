---
id: ERP-42
status: review
context: nafura
kind: task
priority: P0
assignee: agent
gate: none
parent: ERP-40
feature: qa-local-auth-seed
sprint: 2026-W33
tags: [backend, onboarding, qa]
---

# QA local — Lot 2 · Provision tenant+owner + seed preset

> Créer `qa-local` + `qa@…` ; appeler `applyPreset` / `seedReferenceData` (pas INSERT seul).

## Critères d'acceptation
- [x] Tenant `qa-local` + user `qa@nafuralabs.local` provisionnés en Mode B
- [x] Membership ACTIVE + rôles OWNER / SUPER_ADMIN / BTP_INGENIEUR
- [x] `TenantPresetOrchestratorService.applyPreset` exécuté (idempotent)
- [x] Flag-gated (`nafura.dev.cursor-auth-enabled`) — jamais sur pods staging/prod
- [x] Setting `etudes.auteurPeutValider=true` sur le tenant QA

## Journal
```
10/08 20:10  démarré
10/08 20:20  QaLocalProvisioner (ApplicationRunner) + applyPreset
```
