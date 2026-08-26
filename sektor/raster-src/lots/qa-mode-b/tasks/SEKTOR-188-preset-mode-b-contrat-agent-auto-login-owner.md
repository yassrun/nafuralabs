---
id: SEKTOR-188
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [qa, mode-b]
---

# Preset Mode B : contrat agent auto-login owner

> SSOT Mode B pour Spec, Code, QA et Orch : auto-login qa@ / qa-local, preset boot, pas Keycloak. Rôles métier pas encore seedés.

## Étapes

- [x] Écrire le playbook Mode B dans `.cursor/rules/cursor-qa-browser.mdc` (SSOT)
- [x] Pointer Spec, Code, QA, Orch (+ skill Claude orchestration) vers cette rule
- [x] Aligner `sektor/README.md`, `OPS_BLUEPRINT.md`, `CLAUDE.md`, `ops/AGENTS.md`

## Preuves attendues

- La rule nomme tenant `qa-local`, user `qa@nafuralabs.local`, auto-login conservé, interdiction Keycloak et emails par rôle non seedés.
- Chaque skill Raster (`nafura-spec`, `nafura-exec`, `nafura-qa`, `nafura-orch`) cite `.cursor/rules/cursor-qa-browser.mdc`.
- `node raster/t.mjs check` sort 0.

## Journal

```
26/08 10:45  posée
26/08 10:46  SSOT rule + skills + README / blueprints
26/08 10:47  status → doing
26/08 10:47  status → done-agent · gate none → done-me
```

## Rapport de livraison

Playbook Mode B unique dans `.cursor/rules/cursor-qa-browser.mdc` : preset boot (`QaLocalProvisioner` + `applyPreset`), auto-login owner, ordre browser, token API, ce qui n’est pas seedé.

Spec / Code / QA / Orch et le skill Claude orchestration pointent vers cette rule au lieu de copier le flux.

`sektor/README.md`, `OPS_BLUEPRINT.md`, `CLAUDE.md` et `nafura-platform/ops/AGENTS.md` disent la même chose : un owner, auto-login conservé, graphe métier hors preset.

Décidé seul : lot `qa-mode-b` sous la borne (docs agents, pas la fenêtre produit) ; pas d’emails `qa.magasinier@…` présentés comme fonctionnels.
