# Contrat — continuité Étude–Devis–Chantier

> Ce contrat fixe le cycle de vie, la provenance et les montants de référence entre l'étude gagnée, le devis accepté et le chantier créé.
> Il complète [`../arbre-et-conversion/CONTRAT.md`](../arbre-et-conversion/CONTRAT.md) et [`../budget-et-marge/CONTRAT.md`](../budget-et-marge/CONTRAT.md), sans rouvrir leurs décisions.
> Plan d'exécution : [`00-PLAN.md`](00-PLAN.md). Les tasks citent les `AC-n` et ne les recopient pas.

**Qualification : BUG + EVOL.** Audit Mode B du **26/08/2026** sur `DE-0002` / `DV-2026-0002` / `CH-2026-002` : l'étude convertie et l'arbre vendu portent **737 106 MAD HT**, la liste chantier affiche **500 000 MAD de vente**, le budget affiche **582 600 MAD** comme budget et une marge projetée à **0 %**, tandis que le devis source reste **BROUILLON**, modifiable et annulable. Chacun de ces nombres peut représenter une notion différente ; leur présentation actuelle en fait des vérités concurrentes.

Gelé le **26/08/2026**.

---

## Résultat attendu

Une seule action métier clôt la vente : elle approuve et fige la bonne version du devis, marque l'étude gagnée, puis autorise une conversion idempotente. Le chantier reçoit un instantané autonome, traçable et cohérent : **vente contractuelle**, **déboursé initial** et **marge initiale** ne changent ni de sens ni de valeur selon l'écran.

### Propriétaire de chaque vérité

| Fait | Propriétaire avant conversion | Ce que conserve le chantier |
|---|---|---|
| Cycle d'appel d'offres | Étude | identifiant source et statut final, en lecture |
| Document commercial et version | Devis | identifiant, numéro, version et total acceptés |
| Arbre vendu | DPGF du devis accepté | copie fidèle et immutable de l'origine de chaque vendu |
| Déboursé initial | DPU / coût établi | instantané par nœud, révisable à côté uniquement |
| Exécution | — | statut, arbre, budget, avancement, situations |

Le BC Chantiers ne requête pas le BC Études pour reconstruire sa fiche. La conversion lui transmet les références et instantanés nécessaires ; les liens UI sont des navigations par identifiant, pas une dépendance de domaine inverse.

### Dictionnaire financier canonique

| Nom métier / API | Définition | Règle |
|---|---|---|
| `montantVenteInitialHt` | total HT de la version de devis approuvée et copiée | égal à la somme de l'arbre `VENDU` au centime |
| `montantVenteActifHt` | référence de vente courante | devis approuvé tant qu'aucun marché n'est notifié ; futur marché notifié ensuite |
| `debourseInitialHt` | coût établi copié du DPU | somme des déboursés initiaux des nœuds |
| `budgetReviseHt` | dernier coût prévu du chantier | initialisé à `debourseInitialHt`, puis somme des révisions par nœud |
| `margeInitialeHt` | marge au démarrage | `montantVenteInitialHt - debourseInitialHt` |
| `margeInitialePct` | taux de marge initial | `margeInitialeHt / montantVenteInitialHt × 100` |
| `margeProjeteeHt` | marge selon le budget révisé | `montantVenteActifHt - budgetReviseHt` |
| `margeProjeteePct` | taux de marge projeté | `margeProjeteeHt / montantVenteActifHt × 100` |

Si le dénominateur est nul ou absent, le pourcentage vaut **indisponible**, jamais `0 %` par défaut. Les montants sont décimaux, arrondis à deux décimales seulement aux frontières de présentation.

`montantAttribueHt` n'est pas une troisième vente indépendante : c'est la contre-vérification saisie au gain. S'il diffère du total de la version de devis à accepter au-delà de **0,01 MAD**, l'utilisateur doit d'abord produire la version commerciale correspondant à l'attribution. Aucun prorata silencieux, aucune correction d'entête, aucune divergence entre vente et arbre vendu.

---

## Critères d'acceptation gelés

### Gain et devis accepté

**AC-1 — Le gain est une commande atomique.** Une commande métier unique marque l'étude `GAGNE` et le devis lié `APPROUVE`. Elle échoue entièrement si l'une des deux écritures échoue. Une mutation directe qui produirait `GAGNE` avec un devis non approuvé est refusée.

**AC-2 — Un seul devis fait foi.** L'étude gagnée référence exactement un devis et une version acceptés. Le devis appartient à la même étude et au même tenant. Un devis absent, annulé, perdu, expiré ou appartenant à une autre étude interdit le gain avec un message métier.

**AC-3 — L'attribution correspond au document vendu.** Au gain, `montantAttribueHt` est obligatoire et doit être égal au total HT calculé du devis accepté, à `0,01 MAD` près. En cas d'écart, l'écran montre les deux montants et demande de créer/corriger la version du devis ; il ne réécrit ni les lignes, ni le total, ni le montant attribué.

**AC-4 — Une marge négative est un acte explicite.** Si `montantAttribueHt < debourseInitialHt`, le gain est refusé aux rôles ordinaires. `owner` ou `dg` peut confirmer l'exception avec un motif obligatoire ; identité, horodatage, montants et motif sont audités. L'exception ne dispense jamais AC-3.

**AC-5 — Le devis accepté est figé.** Dès `APPROUVE`, et a fortiori quand il est lié à une étude `GAGNE` ou `CONVERTIE`, ses lignes, DPGF, version, client et montants ne sont plus modifiables. Annuler, supprimer, repasser en négociation ou créer une version concurrente est refusé. L'UI n'affiche plus ces actions ; elle garde consulter, télécharger, ouvrir l'étude et, après conversion, ouvrir le chantier.

**AC-6 — Les transitions restent traçables.** Le journal métier porte l'ancien statut, le nouveau statut, l'acteur, la date et l'identifiant de corrélation pour l'étude et le devis. Un rejet d'autorisation ou de cohérence n'écrit aucun état partiel.

### Conversion et provenance

**AC-7 — La conversion conserve ses invariants existants.** Seule une étude `GAGNE` se convertit ; elle devient `CONVERTIE`, le chantier naît `EN_PREPARATION`, aucun marché et aucun planning ne sont créés. Le devis reste `APPROUVE` : il ne reçoit pas un statut artificiel « converti ».

**AC-8 — La conversion est idempotente et concurrent-safe.** Rejouer la conversion renvoie le même chantier. Deux requêtes concurrentes ne créent ni second chantier, ni second arbre, ni second budget.

**AC-9 — La source commerciale est immutable.** Le chantier conserve `dossierEtudeId`, `devisId`, numéro et version de devis, date d'acceptation et source de vente `DEVIS`. Ces références sont posées à la conversion et ne peuvent être changées par une API d'édition chantier.

**AC-10 — Le snapshot financier est cohérent.** À la même transaction logique que la copie :

- `montantVenteInitialHt` = `montantAttribueHt` = total du devis accepté = somme des nœuds `VENDU` ;
- `debourseInitialHt` = somme du déboursé initial copié sur les nœuds ;
- le budget révisé démarre au déboursé initial ;
- les marges sont dérivées avec les formules du dictionnaire, jamais saisies ni stockées comme une vérité concurrente.

Toute divergence empêche la conversion avant création du chantier. Les règles de placement d'un arbre bancal restent celles du contrat `arbre-et-conversion` AC-12.

**AC-11 — Le devis demeure la référence active sans marché.** Tant qu'aucun marché n'est notifié, `montantVenteActifHt` et le libellé de source pointent vers le devis accepté. Ce lot ne crée pas le marché. Lorsqu'un futur marché devient actif, le changement de source doit être explicite et audité ; aucun fallback ne choisit le plus grand montant.

### Lectures et écrans

**AC-12 — Une notion garde le même nom partout.** Étude, devis, liste chantiers, fiche chantier, budget et API utilisent le dictionnaire canonique. `Vente HT` ne désigne jamais un coût ; `budget` ne désigne jamais un prix de vente ; `marge` n'est jamais affichée sans préciser initiale ou projetée.

**AC-13 — Les mêmes sources donnent les mêmes valeurs.** Pour un chantier donné, liste, détail et budget remontent les mêmes `montantVenteActifHt`, `debourseInitialHt`, `budgetReviseHt` et marges. Les read models dérivent des mêmes agrégats ; ils ne maintiennent pas chacun leur total.

**AC-14 — Les absences restent des absences.** Une valeur non calculable s'affiche « Non disponible » avec sa cause. Aucun `0`, aucune date du jour et aucun statut voisin ne servent de valeur par défaut. En particulier, un chantier `EN_PREPARATION` n'est jamais présenté `EN_COURS` sur la page budget.

**AC-15 — La chaîne source est navigable.** Depuis l'étude convertie : ouvrir devis et chantier. Depuis le devis approuvé : ouvrir étude et chantier. Depuis le chantier : ouvrir étude et devis. Chaque lien résout l'identifiant exact du snapshot ; jamais une recherche par numéro ou client.

**AC-16 — Les permissions sont cohérentes des deux côtés.** Le backend reste l'autorité. L'UI cache ou désactive avec explication les gestes interdits ; elle ne propose pas une action qui aboutit mécaniquement à `403`. Les montants financiers non autorisés sont absents, jamais remplacés par zéro.

**AC-17 — La création directe reste honnête.** Un chantier créé sans étude ne fabrique ni `dossierEtudeId`, ni `devisId`, ni source `DEVIS`. Il suit le contrat `arbre-et-conversion` AC-14 et affiche « Sans étude / devis source » ; les mêmes noms financiers s'appliquent aux valeurs qui existent.

**AC-18 — Pas de dépendance au planning.** Tous les AC précédents passent sans activité, zone ou quotité. Le lien Étude–Devis–Chantier et ses montants ne lisent pas le planning.

---

## Hors périmètre

- Notification et cycle du marché, avenants et révision du vendu après conversion.
- Refonte visuelle complète de la fiche chantier : portée par `../cockpit-chantier/`.
- Génération automatique d'un planning ou obligation d'activité.
- Reprise douce de données historiques : environnement lab, changelog et re-seed propres.
- Réouverture d'un devis approuvé. Une correction commerciale produit une version correcte **avant** le gain.

---

## Scénarios de preuve Mode B

Le graphe est créé par API sur le tenant `qa-local`; aucun seed opportuniste ne doit faire passer les tests.

| Scénario | Données discriminantes | Couvre |
|---|---|---|
| `contrat-gain-approuve-et-fige-le-devis` | devis brouillon avec 2 lots, 1 sous-lot, 6 postes | AC-1, AC-2, AC-5, AC-6 |
| `contrat-gain-refuse-un-montant-attribue-different` | devis `737106.00`, attribution `500000.00` | AC-3 |
| `contrat-gain-marge-negative-sous-controle` | vente `500000.00`, déboursé `582600.00`; jouer `ingenieur`, puis `dg` avec motif | AC-4, AC-16 |
| `contrat-conversion-snapshot-coherent` | vente `737106.00`, déboursé `582600.00`, marge `154506.00`, taux `20,96 %` | AC-7, AC-9, AC-10 |
| `contrat-conversion-idempotente` | deux appels, dont une paire concurrente | AC-8 |
| `contrat-memes-montants-partout` | étude, devis, liste, détail, budget | AC-12, AC-13, AC-14 |
| `contrat-navigation-source-bidirectionnelle` | ouvrir chaque maillon par ses trois portes | AC-15 |
| `contrat-sans-marche-sans-planning` | aucun marché, activité, zone ou quotité | AC-11, AC-18 |
| `contrat-chantier-direct-sans-fausse-source` | chantier créé directement | AC-17 |

