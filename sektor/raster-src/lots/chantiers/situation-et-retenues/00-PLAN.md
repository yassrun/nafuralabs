# Situation et retenues

> Le décompte cumulatif marocain, monté depuis les attachements signés.
> **Pas de Pact.** Contrat `CONTRAT.md` (SEKTOR-155) · journal [`DECISIONS-PRODUIT-CHANTIER.md`](../../../DECISIONS-PRODUIT-CHANTIER.md) § les cinq derniers points.

## Verdict

C'est la sortie argent du palier 1. Le modèle en place est **juste** — ce sous-lot ne le refait pas, il le branche et complète les retenues.

## Constat

- `SituationTravaux` porte déjà `cumulPrecedentHt` / `cumulCourantHt` / `travauxPeriodeHt` : le décompte est **cumulatif**, conforme.
- Workflow présent : `BROUILLON → SOUMISE → VALIDEE_MOA → FACTUREE → PAYEE`, plus `REJETEE`.
- Retenues présentes : RG et avance. **Absentes** : pénalités de retard et RAS — alors que `Chantier` porte déjà `tauxRas`.
- Les lignes de situation ne viennent pas des attachements.

## Approche technique

Brancher les lignes sur les attachements validés de la période, valorisés au prix vendu — plus aucune quantité saisie dans la situation. Ajouter pénalités et RAS à la cascade, ordre d'application fixe, paramétré au chantier (`tauxRg`, `tauxAvance`, `tauxRas`). `SituationToFacturePort` reste la sortie vers Ventes.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-155 CONTRAT — décompte cumulatif et retenues (`gate: me`) | SEKTOR-153 | — |
| 2 | SEKTOR-156 La situation se monte depuis les attachements | 155 | — |
| 3 | SEKTOR-157 Pénalités de retard et RAS | 155 | **oui** avec 156 |
| 4 | SEKTOR-158 Preuves | 156, 157 | non |

## Couverture

Gel § **Les cinq derniers points / situation et attachement**.

## Décisions ouvertes

L'ordre exact d'application des retenues (RG, avance, pénalités, RAS) est à confirmer par le métier dans SEKTOR-155.
