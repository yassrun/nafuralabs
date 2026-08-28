# Réception provisoire Al Qods — acte 4

> Contrat parent : [`../CONTRAT.md`](../CONTRAT.md) AC-15 · scénario [`../SCENARIO.md`](../SCENARIO.md) acte 4.
> Prérequis : graphe Al Qods `EN_COURS` (226, situations mois 1/2).

## Verdict

Le backend expose déjà `POST /api/v1/chantiers/{id}/reception-provisoire` et le cockpit bascule en lecture seule (`estTerminal`). Ce sous-lot **prouve** le geste complet : PV document + transition statut + cockpit sans ops terrain.

## Périmètre AC-15

| Fait | Preuve |
|------|--------|
| PV déposé dans Documents | `POST …/documents` type `PV` |
| `EN_COURS` → `RECEPTIONNE_PROVISOIRE` | `POST …/reception-provisoire` |
| `/clore` refusé depuis `EN_COURS` | déjà 226 ; rejoué |
| Cockpit sans avancement / DA / BL | `nextActions` + `fluxMois.actionnable` |
| UI fiche chantier | bouton « Réception provisoire » si `EN_COURS` |

## Preuves

- `sektor/e2e/scripts/verify-alqods-reception-provisoire-242.mjs`
- Agrégat : `verify-alqods-scenario-226.mjs` spawn 242

## Tasks

| # | Task | blocked_by |
|---|------|------------|
| 1 | SEKTOR-242 Scénario acte 4 | — |
| 2 | SEKTOR-243 Preuve API + UI | 242 |
| 3 | SEKTOR-244 QA agrégat | 243 |
