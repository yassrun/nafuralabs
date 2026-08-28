---
id: SEKTOR-224
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-220]
tags: [achats, chantiers, st]
---

# Engager un contrat ST sur un poste sans planning

> Coffrage 2.3 : contrat Achats, BPU, nœud vendu, zéro activité. Conditionné à l'option A de SEKTOR-220.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-8, AC-9.

## Étapes

- [x] Créer le contrat ST depuis le nœud (fournisseur, BPU, montant, chantier, noeudId).
- [x] Refus si nœud INTERNE ou autre chantier.
- [x] Avancement client = quantité sur le nœud. Pas de faux % sur le contrat. Pas d'attachement ST dans ce ticket.

## Preuves attendues

- `alqods-st-coffrage-sans-planning` : contrat 2.3, 0 activité.
- 120 m² déclarés sur 2.3 entrent dans l'attachement client.

## Journal

```
27/08 22:43  posée
28/08 01:49  status → doing
28/08 01:58  status → review
28/08 10:17  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Changé.** Contrat ST exige `noeudId` (poste vendu). Refus INTERNE / hors chantier via `NoeudChantierPort`. `bpuFichier` persisté. Plus de % stocké ni affiché sur le contrat. UI : nœud obligatoire, query `chantierId`/`noeudId`, pas de défaut premier chantier. Verbes CRUX sur les contrôleurs ST.

**Preuve.** `node sektor/e2e/scripts/verify-alqods-st-coffrage-224.mjs` → PASS (`alqods-st-coffrage-sans-planning`, INTERNE 400, hors chantier 400, 120 m² dans l'attachement client). Tests unitaires ST + adapter verts.

**Décidé seul.** Colonnes `noeud_id` / `bpu_fichier` sur `contrats_fournisseur` plutôt qu'un nouvel objet typé (lab). BPU = nom de fichier, pas d'upload MinIO dans ce ticket.

**Écarts.** Capture UI 390 à QA. Liquibase 005 via `migrate` (colonnes déjà sur staging). Attachement ST fournisseur hors périmètre.

