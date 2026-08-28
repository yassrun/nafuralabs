---
id: SEKTOR-223
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-221]
tags: [chantiers, documents]
---

# Rendre les documents du chantier actionnables depuis la fiche

> OS, plan, PV, BL scanné : déposés et listés depuis le cockpit / onglet, filtrés au chantier.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-10, AC-11.

## Étapes

- [x] Action cockpit + onglet Documents avec `chantierId`.
- [x] Types palier 1 : OS, plan, PV, BL, autre. Nœud facultatif.
- [x] Pas de document sans chantier.

## Preuves attendues

- Dépôt OS puis PV visibles sans lister tout le tenant.
- Capture fiche + liste filtrée.

## Journal

```
27/08 22:43  posée
28/08 00:37  status → doing
28/08 00:42  status → review
28/08 01:48  status → review
28/08 01:48  status → review
28/08 01:48  status → review
28/08 10:17  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Changé.** Types palier 1 `OS` / `PLAN` / `PV` / `BL` / `AUTRE` (historiques conservés). `noeudId` facultatif, chantier obligatoire. Filtre listing `?chantierId=` ; dépôt scoped sans défaut premier chantier du tenant. Verbes CRUX sur les contrôleurs documents. Chef IAM documents déjà en 006.

**Preuve.** `node sektor/e2e/scripts/verify-alqods-documents-223.mjs` → PASS. OS déposé par chef-chantier, PV sur nœud 2.1, listing filtré sans orphelin. Test unitaire `DocumentChantierServiceTest` vert. Front 4200 joignable. Browser MCP absent.

**Décidé seul.** PV palier 1 = type `PV` (distinct de `PV_RECEPTION`). Nœud hors chantier refusé. Colonne `documents_chantier.noeud_id` appliquée live (changelog v1.1/002).

**Écarts.** Capture fiche + liste 390 à QA. Liquibase 002 via `migrate` (colonne déjà sur staging). Leftover 222 : après restart Mode B, conducteur DA create → **201** (plus 403). Grant `demande-achat.update` conducteur inséré.

