# Plan — Al Qods mois 2 : situation cumulative + octobre

## But livrable

Reprendre le graphe post-mois-1 : attachement **octobre** (quantités neuves seulement) → situation **n°2** avec `cumulPrecedentHt` = cumul n°1 — discriminants acte 3 SCENARIO.

## Intention

Mois 1 (232–235) a prouvé attachement lu + situation n°1. Il reste le **décompte cumulatif** (2e période) et la clôture acte 3 sur un graphe continu, pas un re-seed isolé.

## Périmètre

Inclus : [`CONTRAT.md`](CONTRAT.md) AC-M2-1..M2-8, [`SCENARIO.md`](SCENARIO.md).

Exclus : pénalités / RAS (→ `situation-et-retenues` AC-8..12), BL partiel acier (226), panne Achats (227), réception provisoire (226 acte 4).

## Approche

1. **SEKTOR-236** — spec gel (gate me).
2. **SEKTOR-237** — exec : octobre attachement + situation n°2 cumul.
3. **SEKTOR-238** — QA preuve agrégée.

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | SEKTOR-236 Scénario mois 2 | spec | — |
| 2 | SEKTOR-237 Situation n2 octobre | exec | 236 |
| 3 | SEKTOR-238 Preuve mois 2 | qa | 237 |

## Preuves

`node sektor/e2e/scripts/verify-alqods-situation-mois2-238.mjs` — enchaîne mois-1 puis octobre + situation n2.
