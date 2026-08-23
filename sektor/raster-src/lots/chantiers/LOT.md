# Chantiers — raffinement du BC

> Le chantier a **son** arbre, le planning est une **couche d'activités**, et tout marche **sans planning** au palier 1.
> **Pas de Pact.** Contrat = [`DECISIONS-PRODUIT-CHANTIER.md`](../../DECISIONS-PRODUIT-CHANTIER.md) — 14 gels du 23/08/2026.

La contrainte qui prime : **un chantier créé depuis une étude est facturable le jour même, sans qu'une seule activité existe.** PME marocaine, pas de planificateur.

## Sous-lots — vague 1 (palier 1 + frontières)

| Sous-lot | Quoi | Dépend de |
|----------|------|-----------|
| `arbre-et-conversion` | nœud vendu / interne, lien retour au poste vendu, conversion `GAGNE` → `EN_PREPARATION` sans marché, un seul écran chantier | — |
| `avancement-et-attachement` | la quantité fait foi, le pourcentage se calcule ; l'attachement lit la période | `arbre` |
| `situation-et-retenues` | décompte cumulatif monté depuis les attachements, pénalités et RAS | `avancement` |
| `budget-et-marge` | déboursé copié du DPU par nœud, marge et valeur acquise | `arbre` |
| `frontieres-bc` | contrat ST typé côté Achats, pilotage portefeuille au socle | — |

## Pas encore coupé — vague 2 (paliers 2 et 3)

Nommé, pas découpé : ces sous-lots n'existeront que quand la vague 1 tient.

| À venir | Quoi |
|---------|------|
| `planning-activites` | activités, WBS libre + zone, rattachement `0..n` nœuds avec quotité, remontée d'avancement |
| `capacite-et-engagement` | affectation MO / matériel (lecture RH), besoins ST et matière poussés en aval |
| `baseline-et-os` | baseline figée à l'OS, prolongation, intempéries depuis le journal |
| `pointage-impute` | le pointage RH troque `posteBudgetaireId` contre l'imputation activité |
| `matiere-et-magasin` | besoin → DA → livraison directe **ou** magasin chantier (`catalogue/`) |

## Hors lot

HSE, réception (PV, réserves), documents et photos rattachés à l'activité : un autre chapitre.
