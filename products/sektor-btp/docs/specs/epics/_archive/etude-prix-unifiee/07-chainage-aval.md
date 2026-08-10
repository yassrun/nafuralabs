# Lot 7 — Chaînage aval : devis, chantier, marché, budget

**Objectif** : une étude validée engendre le devis, puis — si l'affaire est gagnée — le chantier, le
marché et le **budget prévisionnel**. Plus aucun chantier créé ex nihilo.

**Dépend de** : lot 6.

---

## La règle métier

> « On ne veut plus créer un chantier comme ça sans marché. Il passe par cette étape. Sinon, si c'est
> un marché déjà validé, on peut le rajouter à la dernière étape de ce process et créer le marché et
> le chantier par la suite. »

Donc deux entrées, une seule sortie :

```
Entrée A : étude complète      → chiffrage → validation → devis → gagné ┐
                                                                        ├→ Chantier + Marché + Budget
Entrée B : marché déjà attribué → saisie directe à l'étape finale ──────┘
```

L'entrée B n'est pas une échappatoire : elle crée quand même un dossier d'étude, avec son bordereau
et ses montants, marqué `origine = MARCHE_EXISTANT`. On garde une seule porte d'entrée vers le
chantier.

---

## ✅ Q3 tranchée le 2026-07-19

**Le marché d'abord, le chantier en découle** — création **atomique** des deux dans une seule
transaction, depuis un seul écran.

Justification métier : le marché est le contrat qui justifie l'existence du chantier.

**Mise en œuvre** : `ContratMarche.chantierId` reste `NOT NULL` — **aucune migration de schéma**.
L'ordre d'insertion en base (chantier puis marché, pour satisfaire la clé étrangère) est un détail
technique invisible de l'utilisateur, qui voit un écran unique « Créer le marché et son chantier ».

Conforme à la règle du lot 10 : pas de migration de données pour un besoin couvrable par du code.

**Corollaire confirmé par l'expert métier** : les marchés déjà attribués qui n'ont pas fait l'objet
d'une étude doivent **quand même transiter par la phase finale du dossier d'étude** avant de devenir
un chantier. Le dossier d'étude est le **guichet unique** vers le chantier — c'est l'entrée B
(T7.4), et elle n'est pas une échappatoire.

---

## Tâches

### T7.1 — Génération du devis

`DevisGenerationService` existe. `Devis` porte déjà `dpgfId`, `metreId`, `chantierGenereId`.
Vérifier ce qui fonctionne avant de réécrire.

```
POST /api/v1/etudes/dossiers/{id}/generer-devis
```

- statut requis : `VALIDEE`
- `DevisLigne` alimentées depuis les `DpgfNoeud` de type ARTICLE (désignation, unité, quantité, PU HT)
- remise globale possible **sans toucher au chiffrage** — la remise est commerciale, elle ne modifie
  pas le déboursé ni les rendements
- lien bidirectionnel : `Devis.dossierEtudeId` ↔ `DossierEtude.devisGenereId`
- dossier → `DEVIS_GENERE`

**Impact de la remise sur la marge** : si une remise de 5 % est appliquée, l'écran doit afficher la
marge résiduelle réelle. Une remise supérieure à la marge doit déclencher un avertissement bloquant.

### T7.2 — Issue commerciale

```
POST /api/v1/etudes/dossiers/{id}/gagne    { dateAttribution, referenceMarche, montantAttribue }
POST /api/v1/etudes/dossiers/{id}/perdu    { motif, concurrentRetenu?, ecartPrixEstime? }
```

Le motif de perte est structuré (prix trop élevé / délai / technique / administratif / sans suite).
C'est la matière première de l'analyse de taux de réussite — et à terme un signal d'apprentissage
pour l'IA sur le positionnement de marge.

### T7.3 — Conversion en chantier et marché

```
POST /api/v1/etudes/dossiers/{id}/convertir
     { marche: {...}, chantier: {...} }
```

Une seule transaction. En cas d'échec sur l'un, rien n'est créé. La conversion projette :

**Bordereau → arborescence chantier**

Les structures sont quasi identiques, la projection est mécanique :

| Étude | Chantier |
|---|---|
| `DpgfNoeud` type LOT | `ChantierLot` (code, designation, parentLotId, unite, quantite, prixUnitaireHt, montantHt) |
| `DpgfNoeud` type SOUS_LOT | `ChantierLot` avec `parentLotId` |
| `DpgfNoeud` type ARTICLE | `PosteBudgetaire` (rattaché au lot, avec quantite, prixUnitaireHt, montantHt) |

**Chiffrage → budget prévisionnel** *(le vrai gain)*

`BudgetLigne` a `rubrique`, `posteBudgetaireId`, `previsionnelHt`, `engageHt`, `realiseHt`.

Pour chaque article, ventiler le déboursé sec par nature de composant :

```
previsionnelHt(rubrique) = Σ (composant.rendement × composant.prixUnitaire) × article.quantite
                           pour tous les composants de cette nature
```

| Nature composant | Rubrique budgétaire |
|---|---|
| `MATIERE` | MATERIAUX |
| `MAIN_DOEUVRE` | MAIN_OEUVRE |
| `MATERIEL` | MATERIEL |
| `SOUS_TRAITANCE` | SOUS_TRAITANCE |

Les FG et la marge ne descendent **pas** dans le budget d'exécution : le budget de chantier est un
budget de **déboursé**. La marge est un résultat, pas une dépense. (À confirmer — **Q4**.)

> C'est ici que le workflow prend toute sa valeur : le conducteur de travaux compare son réalisé au
> déboursé que l'étude avait prévu, poste par poste et nature par nature. Sans ce chaînage, l'étude
> et le chantier vivent dans deux mondes séparés — ce qui est le cas aujourd'hui.

### T7.4 — Entrée B : marché déjà attribué

Créer un dossier d'étude avec `origine = MARCHE_EXISTANT` :
- import du bordereau contractuel (lot 3)
- montants contractuels saisis, pas calculés
- étapes 3, 4 et 5 **facultatives** (le prix est déjà fixé au contrat)
- conversion immédiate possible vers chantier + marché

La décomposition reste possible et souhaitable même après attribution : c'est elle qui produit le
budget prévisionnel. À proposer, sans l'imposer.

### T7.5 — Traçabilité de bout en bout

Depuis un chantier, remonter : marché → devis → dossier d'étude → chiffrage → offres fournisseurs.
Un fil d'Ariane sur la fiche chantier, et l'inverse sur la fiche étude.

---

## Critères d'acceptation

- [ ] Marché et chantier créés dans une seule transaction ; un échec ne laisse rien derrière
- [ ] `ContratMarche.chantierId` est resté `NOT NULL` — aucune migration de schéma
- [ ] Aucun chemin ne permet de créer un chantier sans passer par un dossier d'étude
- [ ] Une étude validée génère un devis cohérent avec le chiffrage
- [ ] Une remise supérieure à la marge déclenche un avertissement bloquant
- [ ] La conversion crée chantier + marché + arborescence + budget en une transaction
- [ ] Les `ChantierLot` reproduisent la hiérarchie du bordereau
- [ ] Les `BudgetLigne` sont ventilées par nature avec les bons montants
- [ ] Un contrôle croisé sur un cas réel : Σ budget prévisionnel = Σ déboursé × quantités
- [ ] L'entrée B (marché existant) mène au même résultat
- [ ] La traçabilité chantier → étude est navigable dans les deux sens
