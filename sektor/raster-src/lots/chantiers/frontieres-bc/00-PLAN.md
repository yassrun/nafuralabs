# Frontières BC

> Le contrat ST retourne chez Achats, typé. Le pilotage portefeuille remonte au socle.
> **Pas de Pact.** Contrat `CONTRAT.md` (SEKTOR-163) · journal [`DECISIONS-PRODUIT-CHANTIER.md`](../../../DECISIONS-PRODUIT-CHANTIER.md) § frontière ST, § pilotage.

## Verdict

Indépendant de la vague palier 1 — parallélisable. Deux dettes de frontière déjà visibles dans le code, qui empireront dès que le planning s'y branchera.

## Constat

- La ST n'est pas un objet : `ContratFournisseur` avec `type = SOUS_TRAITANCE`, `chantierId`, et `ContratSousTraitanceNotes` qui **encode les champs métier dans `notes`**.
- `ChantierSousTraitanceService` vit dans `achats/`, le web dans `chantiers/sous-traitance/`.
- `PilotageController` et `ChantiersAnalyticsController` vivent dans `chantiers/`, alors que [`DECISIONS.md`](../../../DECISIONS.md) met analytics / pilotage au **socle**.

## Approche technique

Achats : objet contrat ST typé — fournisseur, montant, BPU, cautions, retenue de garantie, factures ; fin du codec. Chantiers garde l'exécution (activités confiées, avancement, attachement ST) — l'attachement ST lui-même est vague 2, seul le contrat bouge ici. Socle : le multi-chantiers (consolidation, cash-flow global) ; `chantiers/` ne sert plus que la lecture d'un chantier.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-163 CONTRAT — frontières ST et pilotage (`gate: me`) | — | — |
| 2 | SEKTOR-164 Contrat ST typé côté Achats | 163 | — |
| 3 | SEKTOR-165 Le pilotage portefeuille remonte au socle | 163 | **oui** avec 164 |
| 4 | SEKTOR-166 Preuves | 164, 165 | non |

## Couverture

Gels § **Frontière ST** et § **Les cinq derniers points / pilotage et KPI**. Hors périmètre : la frontière RH (pointage imputé) — vague 2, elle suppose les activités.

## Décisions ouvertes

Aucune.
