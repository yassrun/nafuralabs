# Chantiers — raffinement du BC

> Le chantier a **son** arbre, le planning est une **couche d'activités**, et tout marche **sans planning** au palier 1.
> **Raster autonome.** Contrat = [`DECISIONS-PRODUIT-CHANTIER.md`](../../DECISIONS-PRODUIT-CHANTIER.md) — 14 gels du 23/08/2026.

La contrainte qui prime : **un chantier créé depuis une étude est facturable le jour même, sans qu'une seule activité existe.** PME marocaine, pas de planificateur.

## Sous-lots — vague 1 (palier 1 + frontières)

| Sous-lot | Quoi | Dépend de |
|----------|------|-----------|
| `arbre-et-conversion` | nœud vendu / interne, lien retour au poste vendu, conversion `GAGNE` → `EN_PREPARATION` sans marché, un seul écran chantier | — |
| `avancement-et-attachement` | la quantité fait foi, le pourcentage se calcule ; l'attachement lit la période | `arbre` |
| `situation-et-retenues` | décompte cumulatif monté depuis les attachements, pénalités et RAS | `avancement` |
| `budget-et-marge` | déboursé copié du DPU par nœud, marge et valeur acquise | `arbre` |
| `frontieres-bc` | contrat ST typé côté Achats, pilotage portefeuille au socle | — |

## Sous-lots — vague 2 (paliers 2 et 3)

Mode : contrats écrits sans agent spec · **1 exec code / sous-lot** · QA Raster seulement si argent (pas sur planning).

| Sous-lot | Quoi | Dépend de |
|----------|------|-----------|
| `planning-activites` | activités, WBS libre + zone, rattachement `0..n` + quotité, remontée d'avancement · [`CONTRAT.md`](planning-activites/CONTRAT.md) | vague 1 |
| `capacite-et-engagement` | affectation MO / matériel (lecture RH), besoins ST et matière poussés en aval | `planning-activites` |
| `baseline-et-os` | baseline figée à l'OS, prolongation, intempéries depuis le journal | `planning-activites` |
| `pointage-impute` | le pointage RH troque `posteBudgetaireId` contre l'imputation activité | `planning-activites` |
| `matiere-et-magasin` | besoin → DA → livraison directe **ou** magasin chantier (`catalogue/`) | `capacite-et-engagement` |

## Hors lot

HSE, réception (PV, réserves), documents et photos rattachés à l'activité : un autre chapitre.
