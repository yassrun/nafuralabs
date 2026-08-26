---
id: SEKTOR-189
status: review
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [qa, mode-b]
---

# Seed users QA par role et session cursor

> Preset qa-local : users IAM par role (ingenieur, conducteur, directeur, daf, dg, chef-chantier, magasinier), cursor-session/qa-token opt-in, auto-login owner inchange. Employes RH lies.

## Étapes

- [x] Roster + seed IAM dans `QaLocalProvisioner`
- [x] `cursor-session?role=` / `?email=` allowlist ; JWT superAdmin owner-only
- [x] `qa-token.sh` alias + `--list`
- [x] Employés RH liés (`QaLocalEmployeProvisioner`)
- [x] Preuves + contrat agents

## Preuves attendues

- `./gradlew.bat :sektor:socle:test --tests ma.nafura.socle.dev.config.QaLocalConstantsTest`
- `node sektor/e2e/scripts/verify-qa-role-users-189.mjs`
- Auto-login front inchangé (POST sans query = owner)

## Journal

```
26/08 10:51  posée
26/08 11:00  seed + session + employes + docs
26/08 11:09  status → doing
26/08 11:09  status → review
```

## Rapport de livraison

`qa-local` seed maintenant 7 users IAM étroits (ingénieur, conducteur, directeur, DAF, DG, chef de chantier, magasinier) en plus de l’owner. Auto-login reste `qa@`.

`POST /api/public/dev/cursor-session?role=magasinier` (ou `qa-token.sh magasinier`) ; alias inconnu → 400. JWT `super_admin` seulement pour l’owner. Employé RH lié à chaque identité.

Preuves : `QaLocalConstantsTest` vert ; `verify-qa-role-users-189.mjs` PASS source, live SKIP (8082 down). Relancer bootRun pour matérialiser les users.

Décidé seul : pas de pointeur/chef d’équipe ; GET `/cursor-identities` pour `--list`.
