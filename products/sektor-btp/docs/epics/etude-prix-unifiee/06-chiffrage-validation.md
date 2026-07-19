# Lot 6 — Chiffrage et validation

**Objectif** : l'étape 5, et une validation qui en est vraiment une.

**Dépend de** : lot 4.

✅ **Q1 et Q2 tranchées le 2026-07-19** — ce lot n'est plus bloqué.

| | Décision |
|---|---|
| **Q1 — niveau des taux** | **Par article** (l'article du bordereau). `PrixDpu` porte `fraisGenerauxPercent` et `margePercent`, comme aujourd'hui. Pas de niveau lot. |
| **Q2 — formule** | **Marge sur le coût de revient**, le coût de revient étant le déboursé sec après application des FG. C'est **la formule déjà implémentée** — aucun changement de calcul. |

---

## Partie A — Chiffrage

### T6.1 — Écran de chiffrage

Tableau des articles, une ligne par ARTICLE, colonnes :

| Code | Désignation | Qté | Unité | Déboursé/u | FG % | Coût revient/u | Marge % | PU HT | Montant HT |
|---|---|---|---|---|---|---|---|---|---|
| 1-1-3 | Béton armé infrastructure | 70 | m³ | 579,50 | 8 | 625,86 | 7 | 669,67 | 46 876,90 |

La colonne **Coût de revient** est affichée entre FG et marge : c'est la base sur laquelle la marge
s'applique, et la rendre visible évite toute ambiguïté sur la formule.

Totaux en pied : déboursé total, coût de revient total, montant HT, TVA, TTC, marge globale en
valeur et en %.

Fonctions attendues :
- **application en masse** d'un taux : sur tout, sur un lot, sur une sélection d'articles
- mise en évidence des articles à marge nulle ou négative
- indication des articles dont le taux diffère du défaut de l'étude

### T6.2 — Ergonomie des taux (Q1)

Les taux sont stockés **par article**. L'héritage n'est qu'une commodité de saisie — sur 800
articles, une saisie unitaire est impraticable.

- valeurs par défaut au niveau **tenant** (`ParametresEtudeService`, lot 9)
- surcharge au niveau **dossier d'étude** (`fraisGenerauxPercentDefaut`, `margePercentDefaut`)
- appliquées à la création de chaque `PrixDpu`
- puis modifiables article par article, ou en masse
- un article modifié individuellement **conserve sa valeur** lors d'une application en masse
  ultérieure, sauf inclusion explicite dans la sélection

Supprimer tout défaut codé en dur restant (lot 1 T1.9). L'incohérence de défaut de marge —
7 % dans `etudes`, 0 % dans `consultation` — est tranchée au profit de la valeur retenue dans les
paramètres tenant.

### T6.3 — Formule de calcul (Q2) — aucun changement

```
coût de revient  = déboursé sec × (1 + FG%)
prix de vente HT = coût de revient × (1 + marge%)
                 = déboursé sec × (1 + FG%) × (1 + marge%)
```

**C'est exactement ce qu'implémente déjà `DpuCalculator.computePrixVenteHt()`** :

```java
return debourse
    .multiply(BigDecimal.ONE.add(fg.movePointLeft(2)))
    .multiply(BigDecimal.ONE.add(marge.movePointLeft(2)));
```

**Ne pas modifier ce calcul.** Les tâches de ce lot portent sur l'ergonomie et l'affichage, pas sur
la formule.

Deux ajouts néanmoins :

1. **Étiquetage explicite** — la colonne s'intitule **« Marge % (sur coût de revient) »**. Afficher à
   côté la marge rapportée au chiffre d'affaires, qui est différente : une marge de 7 % sur coût de
   revient représente 6,54 % du prix de vente. C'est cohérent et voulu, mais un dirigeant qui lit
   « marge 7 % » doit savoir de quoi on parle.

2. **Persister `TypeMarge = SUR_COUT`** sur l'étude. Le calcul reste ainsi reproductible si la
   convention évoluait, sans rejouer d'anciennes études avec une formule nouvelle.

**Cas de test de référence** (à faire valider par l'expert métier) :

| Étape | Valeur |
|---|---|
| Déboursé sec | 1 000,00 |
| FG 8 % → coût de revient | 1 080,00 |
| Marge 7 % → prix de vente HT | **1 155,60** |
| Marge en valeur | 75,60 |
| Marge rapportée au PV | 6,54 % |

### T6.4 — Agrégation et totaux persistés

`DpgfAgregationService` existe déjà — vérifier qu'il remonte bien article → sous-lot → lot → total,
et qu'il persiste les totaux sur `Dpgf` (`totalHt`, `totalTva`, `totalTtc`).

Aujourd'hui `consultation` ne persiste aucun total : le listing ne peut ni afficher ni trier par
montant. À corriger.

Recalcul déclenché sur : modification d'un composant, d'un taux, d'une quantité d'article,
application d'offres fournisseurs.

### T6.5 — Versionnement du chiffrage

`DpuVersion` existe (avec `snapshotJson`). L'utiliser :
- instantané automatique à chaque soumission en validation
- instantané manuel (« Enregistrer cette variante »)
- comparaison de deux versions
- utile en négociation client : « variante à −5 % de marge »

---

## Partie B — Validation

### T6.6 — Corriger le défaut de validation actuel

État actuel (`ConsultationService.validate`) :

```java
public Consultation validate(UUID consultationId) {
    Consultation consultation = requireConsultation(consultationId);
    consultation.setStatus(STATUS_TERMINE);   // aucune vérification
    ...
}
```

Aucun contrôle du statut de départ, et l'endpoint est protégé par `consultation.update` — **la même
permission que celle du rédacteur**. L'auteur valide sa propre étude.

Correctifs :
- vérifier `statut == EN_VALIDATION` avant de valider
- permission dédiée `etude.approve`
- refuser si `approbateur == auteur` (sauf dérogation explicite paramétrée au niveau tenant)

### T6.7 — Brancher le module `approbations`

Le module existe, avec matrice de pouvoir et moteur de workflow
(`ApprovalEngineService`, `MatricePouvoirService`), et n'est pas branché sur les études.

- déclarer un type d'approbation `ETUDE_PRIX`
- circuit selon le **montant** de l'étude (seuils dans la matrice de pouvoir)
- soumission → création d'une instance d'approbation
- décision d'approbation → transition du dossier (`VALIDEE` ou retour `EN_ETUDE` avec motif)

Vérifier les conventions d'intégration dans `products/sektor-btp/backend/modules/approbations/`
avant d'écrire quoi que ce soit — s'aligner sur la façon dont les autres modules s'y branchent.

### T6.8 — Dossier de validation

Ce que voit le N+1, en une page, sans avoir à parcourir l'arbre :

- en-tête : objet, client, montants HT / TVA / TTC
- **marge globale** en valeur et en %
- répartition du déboursé par nature (matières / MO / matériel / sous-traitance)
- **taux de couverture des prix consultés** (issu du lot 5) — sur quoi il s'engage
- articles à marge anormale (nulle, négative, ou hors bornes paramétrées)
- écart au chiffrage précédent si version antérieure
- actions : Approuver / Refuser avec motif obligatoire / Demander des modifications

### T6.9 — Verrouillage post-validation

Une étude `VALIDEE` est en lecture seule. Toute reprise passe par une **nouvelle version**
(`DpuVersion`), jamais par une modification en place. Le contrôle doit être en un seul point
(`assertModifiable`, lot 2 T2.2), pas dupliqué.

---

## Critères d'acceptation

- [ ] Le cas de test de référence (T6.3) passe : 1 000 → 1 080 → 1 155,60
- [ ] `DpuCalculator.computePrixVenteHt()` n'a **pas** été modifié
- [ ] La colonne est intitulée « Marge % (sur coût de revient) » et la marge sur PV est affichée
- [ ] La colonne « Coût de revient » apparaît entre FG et marge
- [ ] Le `TypeMarge = SUR_COUT` est persisté sur l'étude
- [ ] Aucun défaut FG/marge codé en dur
- [ ] Application en masse d'un taux sur un lot ou une sélection fonctionne
- [ ] Un article au taux modifié individuellement n'est pas écrasé par une application en masse
      qui ne l'inclut pas
- [ ] Les totaux sont persistés sur `Dpgf` et le listing peut trier par montant
- [ ] Valider une étude qui n'est pas `EN_VALIDATION` échoue
- [ ] L'auteur ne peut pas valider sa propre étude
- [ ] Le circuit d'approbation suit la matrice de pouvoir selon le montant
- [ ] Le dossier de validation affiche le taux de couverture des prix consultés
- [ ] Une étude validée est en lecture seule
