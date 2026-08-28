# Plan — Dette palier 1 (post Al Qods)

## But livrable

Fermer les écarts **non bloquants** remontés par SEKTOR-226 : résilience cockpit Achats, CTA conversion sans marché, captures UI si possible.

## Intention

`vie-de-chantier` est `done-me` sur le cœur métier (DA, BL, ST, marché notification). Il reste trois dettes visibles en QA réelle :

1. **Panne Achats** — le cockpit affiche « 0 DA » au lieu de « indisponible » (acte 3 scénario).
2. **CTA conversion** — « Créer chantier et marché » alors que le gel dit conversion **sans** marché (doublon périmètre SEKTOR-213, exécuté ici car `finition-parcours` reste en pause).
3. **Captures UI** — desktop + 390 sur ops quotidiennes (Browser MCP souvent absent ; preuve Playwright ou skip documenté).

## Périmètre

Inclus : [`CONTRAT.md`](CONTRAT.md) AC-D1 à AC-D3.

Exclus : reprise `finition-parcours` au complet, planning, finance, refonte études.

## Approche

1. **SEKTOR-227** — dégradation cockpit quand `GET demandes-achat?chantierId=` échoue.
2. **SEKTOR-228** — vocabulaire + dialog conversion (périmètre SEKTOR-213, sans attendre 211).
3. **SEKTOR-229** — QA captures + rejeu 226 ciblé sur les deux fixes.

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | SEKTOR-227 Cockpit DA indisponible | exec | — |
| 2 | SEKTOR-228 CTA conversion sans marché | exec | — |
| 3 | SEKTOR-229 Preuves UI + 226 delta | qa | 227, 228 |

227 et 228 sont **parallélisables** (fichiers disjoints : cockpit vs études). Raster n’enchaîne en série que si un seul agent tient le sous-lot.

## Preuves attendues

- Script ou extension de `verify-alqods-scenario-226.mjs` : panne simulée → tuile DA `indisponible`, pas `0`.
- Aucune occurrence « Créer chantier et marché » sur le geste conversion ; `marcheGenereId` nul après convertir.
- Captures `sektor/e2e/captures/` ou skip propre dans rapport 229.

## Décisions

SEKTOR-213 (`finition-parcours`) reste la spec d’origine ; **228 exécute le même fix** sans lever la pause du sous-lot études. À la livraison : marquer 213 `cancelled` ou `done-me` par sweep humain si doublon avéré.
