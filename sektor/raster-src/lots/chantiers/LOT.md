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
| `continuite-etude-devis-chantier` | gain atomique, devis accepté figé, provenance et dictionnaire financier cohérent jusqu'au chantier | `arbre-et-conversion`, `budget-et-marge` (contrats amendés, pas à rejouer) |
| `cockpit-chantier` | préparation, KPI, alertes, prochaine action et portefeuille décisionnel | `continuite-etude-devis-chantier` |
| `vie-de-chantier` | scénario Al Qods palier 1 : DA, BL, avancement, documents, ST sur poste, marché à la notification, preuve non superficielle | `cockpit-chantier` (consomme, n'attend pas 209) |
| `dette-palier-1` | dette post-226 : résilience DA cockpit, CTA conversion sans marché, captures UI · [`dette-palier-1/CONTRAT.md`](dette-palier-1/CONTRAT.md) | `vie-de-chantier` (done-me) |
| `equipe-autorite` | nomination d’équipe : grade de commandement (DG → DT → conducteur → chef), cascade dans le périmètre · [`equipe-autorite/00-PLAN.md`](equipe-autorite/00-PLAN.md) | — |
| `situation-al-qods-mois-1` | Al Qods septembre : avancement → attachement signé → situation n°1 (RG/avance), sans marché · [`situation-al-qods-mois-1/CONTRAT.md`](situation-al-qods-mois-1/CONTRAT.md) · preuve `verify-alqods-situation-mois1-235.mjs` | `vie-de-chantier`, `dette-palier-1` (**done-me**) |
| `situation-al-qods-mois-2` | Al Qods octobre : attachement neuve → situation n°2 cumul · [`situation-al-qods-mois-2/CONTRAT.md`](situation-al-qods-mois-2/CONTRAT.md) · preuve `verify-alqods-situation-mois2-238.mjs` | `situation-al-qods-mois-1` (**done-me**) |

## Sous-lots — vague 2 (paliers 2 et 3)

Mode historique vague 2 : 1 exec / sous-lot. **`planning-unifie`** : pipeline Spec → Code (plusieurs Tasks), **pas de Task QA**.

| Sous-lot | Quoi | Dépend de |
|----------|------|-----------|
| `planning-activites` | activités, WBS libre + zone, rattachement `0..n` + quotité, remontée d'avancement · [`CONTRAT.md`](planning-activites/CONTRAT.md) | vague 1 |
| `planning-unifie` | L1 fondations : formes/natures, durée ouvrée, calendrier chantier, droits, erreurs distinctes, vues sauvegardées · [`00-PLAN.md`](planning-unifie/00-PLAN.md) | `planning-activites` (AC-1..AC-19 livrés) |
| `capacite-et-engagement` | affectation MO / matériel (lecture RH), besoins ST et matière poussés en aval | `planning-activites` |
| `baseline-et-os` | baseline figée à l'OS, prolongation, intempéries depuis le journal | `planning-activites` |
| `pointage-impute` | le pointage RH troque `posteBudgetaireId` contre l'imputation activité | `planning-activites` |
| `matiere-et-magasin` | magasin chantier comme chemin principal (`catalogue/`) | `capacite-et-engagement` |

## Hors lot

HSE, photos rattachées à l'activité, réception **définitive** / réserves : un autre chapitre.
Documents palier 1 (OS, plan, PV, BL) et DA→BC→BL **direct** : `vie-de-chantier`.
`etudes/finition-parcours` est en pause.
