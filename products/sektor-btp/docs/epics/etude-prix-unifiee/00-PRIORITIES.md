# Priorités et séquencement

## Principe

**Verrouiller le manuel avant d'ajouter l'IA.** Un agent ne peut assister un processus qu'il ne peut
pas observer correctement. Les lots 1 à 7 rendent le processus déterministe et traçable ; la phase IA
vient après, en se branchant sur les ports déjà prévus.

> **Le numéro d'un lot est un identifiant, pas un rang.** L'ordre d'exécution est celui du tableau
> ci-dessous. Les lots 9 et 10 ont été ajoutés après la conception initiale et s'exécutent en tête.

## Graphe de dépendances

```
Lot 10 — 6 règles transverses (à respecter dans TOUS les lots — rien à livrer)
   │
Lot 9 — Référentiel articles et prix     (fondation — prix, catalogue, résolution)
   │
Lot 1 — Fusion du modèle                 (bloquant pour tout le reste)
   │
   ├──► Lot 2 — Dossier d'étude + wizard
   │       │
   │       ├──► Lot 3 — Import non destructif
   │       ├──► Lot 4 — Décomposition + bibliothèque + ouvrages composites
   │       │       │
   │       │       └──► Lot 5 — Branchement sur `achats`
   │       │
   │       └──► Lot 6 — Chiffrage + validation      [dépend de Q1, Q2]
   │               │
   │               └──► Lot 7 — Chaînage aval
   │
   └──► Lot 8 — Migration des données (à exécuter avec le lot 1)
```

## Ordre d'exécution

| Rang | Lot | Titre | Effort | Risque | Bloqué par |
|---|---|---|---|---|---|
| 1 | **9** | [Référentiel articles et prix](09-referentiel-articles-prix.md) | L | Moyen | — |
| 2 | **1** | [Fusion du modèle](01-fusion-modele.md) | L | Élevé — touche le calcul de prix | Lot 9 |
| 3 | **8** | [Suppression des tables `consultation`](08-migration-donnees.md) | S | Faible — plus de migration (Q6) | Lot 1 |
| 4 | **2** | [Dossier d'étude + wizard](02-dossier-etude-wizard.md) | M | Moyen | Lot 1, **chantier P1** |
| 5 | **3** | [Import non destructif](03-import-bordereau-cps.md) | M | Moyen — corrige une perte de données | Lot 2 |
| 6 | **4** | [Décomposition + bibliothèque](04-decomposition-bibliotheque.md) | XL | Moyen — récursivité | Lot 2 |
| 7 | **6** | [Chiffrage + validation](06-chiffrage-validation.md) | M | Faible — formule inchangée (Q2) | Lot 4 |
| 8 | **5** | [Branchement sur `achats`](05-consultation-fournisseurs.md) | M | Faible — réutilise l'existant | Lot 4, Lot 9 |
| 9 | **7** | [Chaînage aval](07-chainage-aval.md) | L | Moyen | Lot 6 |
| — | **10** | [Ne pas se fermer de portes](10-genericite-multitenant.md) | — | — | **règles transverses**, rien à livrer isolément |

> Le lot 9 passe en tête : sans référentiel de prix assaini ni service de résolution, le lot 4
> n'aurait rien à proposer au chiffreur et le lot 5 n'aurait rien à alimenter.
>
> Le lot 5 est passé de XL à M après la découverte que `achats` contient déjà tout le cycle
> d'appel d'offres — il ne reste que le pont à construire.

> Le lot 6 est placé avant le lot 5 volontairement : il rend le parcours **complet et livrable**
> (une étude peut être chiffrée et validée avec des prix manuels). Le lot 5 enrichit ensuite la
> provenance des prix sans bloquer la mise en service.

## Jalons

| Jalon | Contenu | Ce qui devient possible |
|---|---|---|
| **J0** — Référentiel sain | Lot 9 | Un prix a une source, une date et une devise |
| **J1** — Socle sain | + Lots 1 + 8 | Une seule vérité de prix, calculs corrects |
| **J2** — Parcours manuel complet | + Lots 2, 3, 4, 6 | **Mise en service** : une étude réelle bout en bout, validée |
| **J3** — Prix tracés | + Lot 5 | Chiffrages appuyés sur des offres réelles ; le cycle achat alimente le référentiel |
| **J4** — Chaîne complète | + Lot 7 | Étude → devis → chantier → budget prévisionnel |
| **J5** — Assistance IA | phase suivante | Extraction + suggestion sur les ports |

**J2 est le jalon qui compte.** C'est le moment où l'expert métier peut faire une vraie étude dans
l'outil et où on arrête de deviner. Tout doit être orienté vers l'atteinte de J2.

## Risques

| Risque | Impact | Mitigation |
|---|---|---|
| ~~Perte de données au lot 8~~ | — | **Éliminé** par Q6 : aucune donnée à reprendre |
| **Travail front écrit dans l'arbre mort** | Élevé — code jamais déployé | Le build ne compile que `web/app/applications/erp/`. Chantier P1 avant le lot 2 ; d'ici là, écrire dans l'arbre vivant |
| Régression de calcul de prix | Critique | Tests de non-régression sur cas réels **avant** de toucher au calcul (lot 1, tâche 1). La formule elle-même ne change pas (Q2) |
| Bibliothèque vide → IA inutilisable | Retarde J5 | Lot 4 rend la capitalisation obligatoire, pas optionnelle |
| **Recréer un doublon d'un module existant** | Élevé — c'est déjà arrivé deux fois | Avant tout nouveau module ou entité : recenser l'existant dans `item`, `achats`, `stock`, `partner`, `currency`, `marches`, `chantiers` |
| Cycle infini sur ouvrages composites | Élevé | Détection de cycle obligatoire avant persistance (lot 4 T4.2bis) |
| Choix imposant une migration future | Moyen | Les 6 règles du lot 10 — périmètre Maroc, mais pas de verrou de schéma |
| **Sur-ingénierie au nom du « futur »** | Moyen — ralentit J2 | Le périmètre est marocain. Ne rien construire d'international : le lot 10 liste explicitement ce qu'on **ne fait pas** |
