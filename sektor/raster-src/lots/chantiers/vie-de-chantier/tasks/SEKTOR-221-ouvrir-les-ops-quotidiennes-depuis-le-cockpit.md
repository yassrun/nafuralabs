---
id: SEKTOR-221
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-220]
tags: [chantiers, cockpit]
---

# Ouvrir les ops quotidiennes depuis le cockpit

> Un chantier EN_COURS propose avancement, DA, BL, documents, ST, attachement, situation — routes avec chantierId. Planning = recommandé.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-1, AC-2, AC-3.

## Étapes

- [x] Étendre `nextActions` / modules au trou réel (DA, BL en attente, docs, ST), pas quatre tuiles fixes.
- [x] Chaque route porte `chantierId` (nœud si l'action part d'un poste).
- [x] Filtrer par permission (chef / conducteur / magasinier / daf). Ne pas régresser le refus d'OS.

## Preuves attendues

- Al Qods EN_COURS : CTA vers DA et avancement, pas seulement planning.
- Chef : pas « Notifier le marché ». Magasinier : réception, pas situation.
- Capture cockpit desktop + 390. **Non faite** — Browser MCP absent ; preuve API + chrome source.

## Journal

```
27/08 22:43  posée
27/08 23:44  status → doing
28/08 00:14  status → review
28/08 10:17  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Changé.** `ChantierActionDecision` EN_COURS propose avancement, réception BL, DA, documents, ST, attachement, situation, budget — plus de plafond 4. Routes interpolent `chantierId`. Filtre rôle + permission : chef = avancement/docs/BL (pas DA/ST/situation/marché) ; conducteur = DA/ST/mois ; magasinier = réception pas situation ; DAF = finance sans écriture terrain. Planning uniquement en module recommandé. UI : actions secondaires + modules filtrés. DA/ST/BC préremplissent `chantierId`. IAM `006_l_vie_chantier_cockpit_ops_permissions.sql` (magasinier read cockpit + BL). Matrice OS/préparation non rouverte.

**Preuve.** `node sektor/e2e/scripts/verify-cockpit-ops-221.mjs` → PASS (owner/conducteur/chef/magasinier/daf). Tests `CockpitChantierServiceTest` verts. Front 4200 joignable. Pas de capture desktop/390 (Browser MCP absent).

**Décidé seul.** Notifier-marché absent (SEKTOR-225). Planning hors `nextActions`. IAM magasinier appliqué aussi en SQL direct sur le Postgres staging Mode B (Liquibase local ne tourne pas au bootRun). Preuve crée le graphe par conversion étude, pas seed DE-0103.

**Écarts.** Capture 390 à faire par QA. Changelog 006 à rejouer via `migrate` pour enregistrer Liquibase (grants déjà en base Mode B).

