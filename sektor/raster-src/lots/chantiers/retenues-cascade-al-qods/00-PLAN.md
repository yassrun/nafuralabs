# Retenues cascade Al Qods — AC-8..12

> Pénalités saisies, RAS dérivée du chantier, cascade fixe sur le graph Al Qods mois 1.
> Contrat parent : [`../situation-et-retenues/CONTRAT.md`](../situation-et-retenues/CONTRAT.md) (AC-8 à AC-12).
> Prérequis : attachement signé + situation depuis attachement ([`../situation-al-qods-mois-1/`](../situation-al-qods-mois-1/)).

## Verdict

Le backend (`SituationGenerationService.computeFinancialTotals`, param `penalitesRetardHt`, `Chantier.tauxRas`) est en place depuis SEKTOR-157. Ce sous-lot **prouve** la cascade sur le scénario Al Qods et remplace le stub `verify-situation-et-retenues.mjs`.

## Périmètre

| AC | Preuve |
|----|--------|
| AC-8 | `POST …/generate?penalitesRetardHt=1000` fige le montant sur la situation |
| AC-9 | `tauxRas` lu sur le chantier, jamais saisi sur la situation |
| AC-10 | RG/avance sur assiette travaux − pénalités ; net TTC avant RAS |
| AC-11 | Lecture code `FactureClientService.createFromSituation` — pas de `rasMontant` |
| AC-12 | Sans pénalités ni `tauxRas` → gold mois 1 inchangé |
| AC-13 | grep i18n chantiers (vocabulaire marocain) |

## Preuves

- `sektor/e2e/scripts/verify-situation-retenues-al-qods-241.mjs` — API Mode B
- `sektor/e2e/scripts/verify-situation-et-retenues.mjs` — agrégat (spawn 241 + grep AC-11/13)

## Tasks

| # | Task | blocked_by |
|---|------|------------|
| 1 | SEKTOR-239 Scénario retenues Al Qods AC-8..12 | — |
| 2 | SEKTOR-240 Preuve cascade pénalités/RAS Mode B | 239 |
| 3 | SEKTOR-241 QA agrégat situation-et-retenues | 240 |
