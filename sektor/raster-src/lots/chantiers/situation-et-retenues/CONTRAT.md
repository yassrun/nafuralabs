# Contrat — Le décompte cumulatif, lu depuis les attachements, et sa cascade de retenues

> Ce sous-lot est autonome. Ce fichier est le **seul ancrage QA** (`AC-n` gelés).
> Journal produit : [`DECISIONS-PRODUIT-CHANTIER.md`](../../../DECISIONS-PRODUIT-CHANTIER.md) — § Simplicité, § Les cinq derniers points / situation et attachement.
> Plan du sous-lot : [`00-PLAN.md`](00-PLAN.md).
> Contrats voisins, à ne pas contredire : [`../arbre-et-conversion/CONTRAT.md`](../arbre-et-conversion/CONTRAT.md) — nature `VENDU` / `INTERNE`, **AC-5 : un interne n'entre jamais dans une situation** · [`../budget-et-marge/CONTRAT.md`](../budget-et-marge/CONTRAT.md) — déboursé et marge par nœud, non touchés ici · [`../avancement-et-attachement/CONTRAT.md`](../avancement-et-attachement/CONTRAT.md) — **le contrat dont celui-ci hérite directement** : l'attachement est une période, ses lignes pointent un nœud, seuls les vendus y entrent (son AC-13), et il est **signé par le MOE** via un lien à jeton sécurisé (son AC-15, AC-19) — c'est ce document signé qui fait foi, jamais une ressaisie.
> Les preuves attendues vivent ici. Pas de canvas : les écrans existent déjà (situations, workflow).

**Qualification : EVOL.** Le modèle `SituationTravaux` est juste — décompte **cumulatif** (`cumulPrecedentHt` / `cumulCourantHt` / `travauxPeriodeHt`), workflow `BROUILLON → SOUMISE → VALIDEE_MOA → FACTUREE → PAYEE` (+ `REJETEE`). Ce qui ne va pas : `SituationGenerationService` monte ses lignes depuis `ChantierLot` (les **lots seuls**, `quantite × prixUnitaireHt`) et depuis `AvancementPhysique` directement — jamais depuis un attachement, jamais depuis un poste. Un poste vendu placé sous un lot d'accueil interne (le cas d'AC-12 du contrat `arbre-et-conversion`) n'est donc représenté nulle part dans une situation aujourd'hui. Les retenues s'arrêtent à RG et avance ; pénalités de retard et RAS sont absentes alors que `Chantier` porte déjà `tauxRas`.

Gelé le **24/08/2026**. Les tasks exec **référencent** `AC-n` ; elles ne les recopient pas.

---

## Intention

Une situation ne fait que **relire** ce que l'attachement signé a déjà établi et valoriser. Elle n'invente plus de quantité, elle ne descend plus au seul niveau lot.

| | Aujourd'hui | Après |
|--|-------------|-------|
| Source des lignes | `ChantierLot`, tous les lots du chantier, quantité = cumul des `AvancementPhysique` validés sur le `lotId` | les **attachements signés MOE** de la période, ligne par **nœud** (poste ou lot-feuille), comme l'attachement lui-même |
| Grain d'une ligne | un lot uniquement — un poste vendu sous un lot interne n'apparaît **jamais** | le nœud exact de l'attachement — hérite de AC-12/AC-13 du contrat voisin |
| Quantité saisie dans la situation | aucune saisie de quantité *à l'écran*, mais le calcul relit une source parallèle (`AvancementPhysique`) indépendante de l'attachement | **zéro** source de quantité en dehors des attachements signés consommés |
| Retenues | RG, avance | + **pénalités de retard**, + **RAS** — cascade à ordre fixe (AC-10) |
| Sortie facture | `SituationToFacturePort`, sur `netAPayerHt` / `netAPayerTtc` | **inchangée** — la RAS ne réduit jamais le montant transmis à Ventes (AC-11) |

**Palier 1, et rien de plus.** Aucun critère de ce contrat n'exige une activité, une zone ou une quotité. Une situation se monte sur un chantier qui n'a que des attachements signés — rien d'autre.

---

## Critères gelés

### La situation se monte depuis les attachements signés

**AC-1 — Une situation ne lit plus `AvancementPhysique` ni `ChantierLot.quantite`.** Le calcul des quantités et des montants d'une situation ne consulte plus, directement ou indirectement, les déclarations d'avancement ni la quantité prévue d'un lot. Sa seule source est l'ensemble des **attachements au statut `SIGNE_MOE` ou au-delà** (`AttachementChantier.STATUTS_FIGES`) du chantier. Un attachement `BROUILLON` ou `EN_ATTENTE_MOE` n'est jamais lu par une situation — seul un document signé fait foi (contrat voisin, AC-15).

**AC-2 — Une ligne de situation pointe un nœud, comme une ligne d'attachement.** `SituationLigne` porte l'identifiant du **nœud** de l'arbre (poste ou lot-feuille) dont elle vient — le même nœud que sur `AttachementLigne.noeudId`. Le grain « lot seul » disparaît : une ligne existe pour chaque nœud touché par au moins un attachement consommé, qu'il s'agisse d'un poste sous un lot vendu ou d'un poste vendu isolé sous un lot d'accueil interne. Code, désignation, unité et prix unitaire vendu sont **lus sur le nœud** à la génération — jamais recopiés ni ressaisis, exactement comme AC-12 du contrat voisin.

**AC-3 — La quantité d'une ligne est la somme des quantités d'attachement du nœud, sur les attachements que la situation consomme.** Aucune quantité n'est retapée : c'est `AttachementLigne.quantitePeriode`, sommée par nœud sur les attachements retenus (AC-4), qui vaut quantité de la période pour la situation. Le montant HT de la ligne est cette quantité multipliée par le prix unitaire vendu du nœud.

**AC-4 — Chaque attachement signé n'est consommé que par une seule situation.** Générer une situation retient les attachements `SIGNE_MOE` (ou au-delà) du chantier qui n'ont **pas encore** été consommés par une situation antérieure de ce chantier. La période de la situation (`datePeriodeDebut` / `datePeriodeFin`) est bornée par la plus ancienne et la plus récente des dates des attachements qu'elle consomme — elle ne se saisit jamais à la main. Un attachement une fois consommé ne l'est plus jamais par une situation suivante : pas de doublon, pas d'oubli, la même règle qu'AC-16 du contrat voisin, un cran plus haut.

**AC-5 — Générer une situation sans attachement signé disponible est refusé.** S'il n'existe, au moment de la génération, aucun attachement `SIGNE_MOE` (ou au-delà) non encore consommé pour ce chantier, la génération est **refusée** avec un message qui le dit — pas de situation vide, pas de situation à zéro qui masquerait l'absence de matière.

**AC-6 — Le décompte reste cumulatif, sans rien changer à sa forme.** `cumulPrecedentHt` (repris de la situation précédente), `cumulCourantHt` (cumul précédent + travaux de la période valorisés), `travauxPeriodeHt` (la différence) gardent exactement leur sens et leurs colonnes actuels. Ce contrat change la **source** des lignes, jamais la mécanique du cumul ni le workflow (`BROUILLON → SOUMISE → VALIDEE_MOA → FACTUREE → PAYEE`, `REJETEE`), qui reste tel quel.

**AC-7 — Une ligne interne n'apparaît jamais.** Conséquence directe d'AC-13 du contrat voisin : puisque les lignes viennent des attachements, et qu'un attachement ne contient que des nœuds `VENDU`, aucun filtre de nature supplémentaire n'est nécessaire côté situation — mais aucune régression ne doit réintroduire une lecture directe de `ChantierLot`/`PosteBudgetaire` qui contournerait ce filtre.

### Pénalités de retard et RAS entrent dans la cascade, à un ordre fixe

> **Décision tranchée ici** (pas laissée ouverte) : voir la `## Question` de la task SEKTOR-155 pour l'arbitrage et pourquoi il n'est pas remonté.

**AC-8 — Les pénalités de retard sont un montant saisi, jamais un pourcentage ni un calcul automatique.** Une situation porte un montant de pénalités de retard, en HT, **par défaut à zéro**. Ce montant est **saisi** au moment de la situation — le palier 1 n'a ni baseline ni planning tenu (gel Simplicité) pour en déduire un retard tout seul ; le calculer depuis un glissement de planning est explicitement **hors périmètre** (planning = palier 2/3). Une fois la situation validée MOA, ce montant est **figé** comme le reste de la situation.

**AC-9 — La RAS se calcule, elle ne se saisit jamais sur la situation.** Le taux de retenue à la source vient de `Chantier.tauxRas`. Une situation ne porte aucun champ où ce taux se retape : le montant de RAS d'une situation est **dérivé** du taux du chantier et de l'assiette définie en AC-10, à chaque génération. Un chantier sans `tauxRas` renseigné (`null` ou zéro) produit une RAS à zéro — jamais une erreur.

**AC-10 — L'ordre de la cascade est fixe : pénalités, puis RG et avance, puis TVA, puis RAS.**

| # | Ligne | Assiette | Calcul |
|---|-------|----------|--------|
| 1 | Travaux de la période HT | — | `cumulCourantHt − cumulPrecedentHt` (inchangé, AC-6) |
| 2 | **Pénalités de retard** | — | montant saisi (AC-8), déduit en premier : elles sanctionnent le fait exécuté, avant toute retenue proportionnelle au paiement |
| 3 | Retenue de garantie (RG) | Travaux de la période HT **moins** pénalités | `tauxRg` % de l'assiette — formule inchangée, assiette élargie pour exclure les pénalités déjà sanctionnées |
| 4 | Retenue d'avance | la **même assiette** que RG (parallèle, pas en cascade sur RG — comme aujourd'hui) | `tauxAvance` % de l'assiette — **le taux réel du chantier**, pas une constante |
| 5 | **Net à payer HT** | — | ligne 1 − ligne 2 − ligne 3 − ligne 4 (remplace le calcul actuel, qui ignorait les pénalités) |
| 6 | TVA | Net à payer HT | `tauxTva` % — inchangé |
| 7 | **Net à payer TTC** | — | ligne 5 + ligne 6 — **c'est le montant facturé à Ventes, inchangé (AC-11)** |
| 8 | **RAS** | Net à payer TTC | `tauxRas` % — **ligne informative, ne réduit jamais la ligne 7** |

**Constaté en écrivant ce contrat, à corriger dans SEKTOR-157 :** `SituationGenerationService.resolveRetenueAvancePercent` renvoie aujourd'hui une constante (`5`) dès que `tauxAvance` est positif, au lieu du taux réel du chantier. La ligne 4 ci-dessus fixe le comportement correct — l'exec corrige ce point en même temps qu'il ajoute pénalités et RAS, ce n'est pas un second ticket.

Le double calcul RG/avance sur la **même assiette, en parallèle** (ligne 3 et 4 ne se cascadent pas l'une sur l'autre) est celui qui existe déjà dans `computeFinancialTotals` — ce contrat ne le change pas, il y insère seulement la déduction des pénalités en amont des deux.

**AC-11 — La RAS ne change jamais ce qui est facturé.** `SituationToFacturePort` continue de recevoir `netAPayerHt` / `netAPayerTtc` calculés sans la RAS (lignes 5 et 7 du tableau) — la retenue à la source est une charge fiscale retenue par le maître d'ouvrage lors du **règlement**, pas une réduction de la créance. Elle est portée par la situation comme une ligne supplémentaire, lisible à l'écran, jamais transmise au BC Ventes. C'est ce qui garde `SituationToFacturePort` inchangé, comme l'exige ce sous-lot.

**AC-12 — La cascade est calculable même à zéro.** Un chantier sans pénalités saisies et sans `tauxRas` produit une situation identique à celle d'aujourd'hui (RG, avance, net à payer HT/TTC) — aucun champ, aucun écran ne devient obligatoire pour les chantiers qui n'utilisent pas ces deux retenues.

### Vocabulaire

**AC-13 — Le vocabulaire du chantier marocain.** À l'écran et dans les messages d'erreur : **situation**, **décompte**, **attachement**, **retenue de garantie (RG)**, **avance**, **pénalités de retard**, **RAS**, **net à payer**. N'apparaissent **jamais** : « quotité », « WBS », « valeur acquise », « earned value », « ligne d'équilibre », ni le mot **activité** (réservé au palier 2). Le nom interne d'un calcul n'est pas son libellé — même règle qu'AC-18 du contrat voisin.

---

## Hors périmètre (dette nommée, pas AC)

- **Le planning et le palier 2/3.** Aucune imputation à l'activité, aucune baseline, aucun calcul automatique de retard depuis un glissement de planning : les pénalités de retard sont saisies (AC-8), jamais dérivées. Se brancher sur un retard mesuré par planning est un autre chapitre.
- **Les avenants et travaux supplémentaires.** Une quantité au-delà du prévu passe par l'avenant (contrat voisin, AC-5) avant d'atteindre l'attachement puis la situation — ce contrat ne construit pas cette porte.
- **Le contreseing MOA et les statuts `EN_ATTENTE_MOA` / `CONTRESIGNE_MOA` / `CONTESTE` / `CLOS` de l'attachement.** Ce contrat consomme un attachement dès `SIGNE_MOE` (contrat voisin, `STATUTS_FIGES`) ; il ne dépend pas du contreseing MOA pour être facturable.
- **Le calcul du déboursé, du réel imputé et de la marge** — [`../budget-et-marge/CONTRAT.md`](../budget-et-marge/CONTRAT.md), non touché ici. La situation valorise au **prix vendu**, jamais au coût.
- **La déclaration `AvancementPhysique` et l'attachement lui-même** — [`../avancement-et-attachement/CONTRAT.md`](../avancement-et-attachement/CONTRAT.md). Ce contrat ne change ni l'un ni l'autre ; il change seulement ce que `chantiers/service/SituationGenerationService.java` va lire.
- **Le taux de RAS effectif selon le régime fiscal du marché** (marché public / privé, sous-traitance, résident / non-résident). `Chantier.tauxRas` reste un taux unique, saisi tel quel — ce contrat ne modélise pas les règles fiscales qui le déterminent.
- **Migration de données.** Lab métier : schéma clean + re-seed. Les situations déjà générées sur l'ancien modèle (lot seul, `AvancementPhysique`) ne sont pas reprises.
- **L'écran / la maquette de saisie des pénalités.** Ce contrat pose le champ et sa place dans la cascade (AC-8, AC-10) ; son emplacement exact à l'écran n'est pas un `AC-n`.

---

## Scénarios e2e (noms) + état initial

L'exec implémente ; le QA joue. Ne pas choisir des valeurs qui passent toutes seules.

| Scénario | Couvre |
|----------|--------|
| `situation-lignes-depuis-attachements-signes` | AC-1, AC-2, AC-3 |
| `situation-poste-vendu-sous-lot-interne` | AC-2, AC-7 |
| `situation-attachement-non-signe-ignore` | AC-1 |
| `situation-attachement-consomme-une-seule-fois` | AC-4 |
| `situation-sans-attachement-signe-refusee` | AC-5 |
| `situation-decompte-cumulatif-deux-periodes` | AC-6 |
| `situation-cascade-penalites-rg-avance-ras` | AC-8, AC-9, AC-10 |
| `situation-ras-n-affecte-pas-la-facture` | AC-11 |
| `situation-cascade-a-zero-sans-penalites-ni-ras` | AC-12 |
| `situation-vocabulaire-chantier` | AC-13 |

**État initial requis :**

- Tenant `qa-local`.
- **Un chantier issu d'une conversion** (contrat `arbre-et-conversion`) avec **≥ 2 lots**, dont **au moins un poste `VENDU` placé sous un lot d'accueil `INTERNE`** — le cas concret d'AC-2/AC-7.
- **`Chantier.tauxRg`, `tauxAvance` et `tauxRas`** tous renseignés à des valeurs distinctes et non nulles, pour que la cascade (AC-10) prouve un ordre, pas une coïncidence numérique.
- **Au moins deux attachements signés MOE**, sur deux périodes non chevauchantes, avec des quantités et nœuds distincts — pour AC-4 et AC-6 (deux situations successives).
- **Un attachement `BROUILLON` ou `EN_ATTENTE_MOE`** sur la même période qu'un attachement signé plus ancien, à ne jamais voir apparaître dans une situation (AC-1).
- **Un chantier avec `tauxRas` à `null`** et un autre avec des pénalités à zéro, pour AC-12.
- Une situation avec des **pénalités de retard saisies à un montant non nul**, pour prouver AC-8 et sa place dans la cascade (AC-10).
- **Aucune activité, aucune zone, aucune quotité** nulle part. Tous les scénarios doivent passer sans.
