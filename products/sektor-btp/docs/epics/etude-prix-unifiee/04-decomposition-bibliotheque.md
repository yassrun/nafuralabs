# Lot 4 — Décomposition et bibliothèque d'ouvrages

**Objectif** : l'étape 3 du wizard, et la boucle de capitalisation qui rendra l'IA possible.

**Dépend de** : lot 2. **Prérequis à** : phase IA.

---

## Pourquoi ce lot est le plus important pour la suite

Un agent IA ne peut proposer « pour du béton B35, compte 350 kg de ciment par m³ » que s'il existe un
corpus de décompositions validées. `Ouvrage` + `ComposantOuvrage` existent déjà et sont **vides**.

`DpuService.importFromOuvrageDetail()` sait déjà instancier un `PrixDpu` depuis un ouvrage type
(bibliothèque → étude). **Le chemin inverse n'existe pas** : rien ne permet de capitaliser une
décomposition validée en ouvrage type.

Sans ce chemin, la bibliothèque reste vide, et l'assistance IA n'aura aucune base. C'est pour ça que
la capitalisation est **obligatoire dans ce lot**, pas remise à plus tard.

---

## Tâches

### T4.1 — Écran de décomposition

Pour chaque ARTICLE du bordereau, l'utilisateur choisit :

**Mode FOURNI** — l'article est acheté prêt à l'emploi. Un seul prix, pas de décomposition.
Rattachement direct à un article du catalogue `item`.

**Mode DECOMPOSE** — sous-détail de prix. Table de composants :

| Type | Désignation | Unité | **Rendement** | PU | Total | Provenance |
|---|---|---|---|---|---|---|
| MATIERE | Ciment CPJ 45 | kg | **350** | 1,20 | 420,00 | Catalogue |
| MATIERE | Sable | m³ | **0,400** | 180,00 | 72,00 | Manuel |
| MATERIEL | Bétonnière | h | **0,250** | 80,00 | 20,00 | Manuel |
| MAIN_DOEUVRE | Maçon | h | **1,500** | 45,00 | 67,50 | Manuel |
| | | | | **Déboursé sec / m³** | **579,50** | |

**Impératif d'interface** : la colonne s'intitule **« Rendement (par unité) »**, jamais « Quantité ».
L'en-tête rappelle l'unité de l'ouvrage : « Rendement par **m³** ». Le total est libellé
« Déboursé sec **par m³** ».

C'est l'ambiguïté de vocabulaire qui a produit le bug d'origine. L'UI doit la rendre impossible.

Types de composants (`ComposantDpu.TYPE_*`, déjà définis) : `MATIERE`, `MAIN_DOEUVRE`, `MATERIEL`,
`SOUS_TRAITANCE`.

### T4.2 — Instanciation depuis la bibliothèque

Bouton « Reprendre un ouvrage type » sur un article :

1. Recherche dans `Ouvrage` (par code, désignation, catégorie, unité compatible)
2. Prévisualisation des composants et de leurs rendements
3. Instanciation via `DpuService.importFromOuvrageDetail()` — **déjà implémenté**
4. `sourcePrix = BIBLIOTHEQUE`, `source_ouvrage_id` renseigné
5. Les rendements restent modifiables (l'ouvrage type est un point de départ, pas un carcan)

⚠️ Vérifier la compatibilité d'unité : reprendre un ouvrage en m³ sur un article en m² doit être
refusé ou demander une confirmation explicite.

### T4.2bis — Ouvrages composites : un ouvrage dans un ouvrage *(décidé — D9)*

Un ouvrage peut contenir un autre ouvrage. Exemple réel : « m² de cloison » contient
« m³ de mortier », lui-même décomposé en ciment / sable / eau / MO.

```java
class ComposantOuvrage {
    String natureComposant;   // ITEM | OUVRAGE          ← nouveau
    String articleId;         // si ITEM   → item.id
    UUID   ouvrageRefId;      // si OUVRAGE → ouvrage.id  ← nouveau
    BigDecimal rendement;     // quantité du composant PAR UNITÉ de l'ouvrage parent
    boolean inclureFraisEtMarge;  // cf. ci-dessous       ← nouveau
}
```
Même extension sur `ComposantDpu`.

#### Calcul récursif

```
deboursé(ouvrage) = Σ composants :
    si ITEM     → rendement × prixUnitaire(item)
    si OUVRAGE  → rendement × deboursé(sous-ouvrage)        [récursion]
```

**Décision — on prend le déboursé du sous-ouvrage, pas son prix de vente.** FG et marge ne
s'appliquent qu'une seule fois, au sommet. Sinon on obtient de la marge sur marge, qui gonfle le
prix de façon invisible et non auditable.

**Exception** : la sous-traitance. Un lot sous-traité est acheté à un prix qui inclut déjà les FG et
la marge du sous-traitant. D'où le drapeau `inclureFraisEtMarge` : quand il est vrai, on remonte
`prixVenteHt(sous-ouvrage)` au lieu de son déboursé. Défaut : `false`.

#### Contraintes impératives

| Contrainte | Règle |
|---|---|
| **Cycles** | Détection obligatoire avant persistance. A → B → A doit être refusé avec un message nommant le cycle. Sans ça : récursion infinie. |
| **Profondeur** | Limite à 5 niveaux (paramétrable). Au-delà, c'est une erreur de modélisation. |
| **Unités** | Le rendement d'un sous-ouvrage s'exprime dans l'unité du **sous-ouvrage**, par unité du **parent**. Ex. 0,03 m³ de mortier par m² de cloison. L'UI doit afficher les deux unités : « 0,030 m³/m² ». |
| **Cascade** | Modifier le prix d'un `Item` invalide tous les ouvrages qui l'utilisent, **transitivement**. |

#### Propagation des recalculs

Le point techniquement délicat. Recalculer naïvement à chaque lecture est trop coûteux ; ne pas
recalculer produit des prix périmés.

Approche retenue : **table de fermeture transitive**.

```sql
CREATE TABLE ouvrage_dependances (
    tenant_id      UUID NOT NULL,
    ouvrage_id     UUID NOT NULL,   -- l'ouvrage parent
    depend_de_type VARCHAR(10) NOT NULL,   -- ITEM | OUVRAGE
    depend_de_id   UUID NOT NULL,
    profondeur     INT  NOT NULL,   -- 1 = direct
    PRIMARY KEY (tenant_id, ouvrage_id, depend_de_type, depend_de_id)
);
```

Maintenue à chaque modification de composition. Un changement de prix sur un `Item` donne
immédiatement, en une requête, la liste des ouvrages à recalculer. Recalcul par profondeur
décroissante.

#### Instantané vs lien vivant

Quand un ouvrage composite est instancié dans une étude, la composition est **copiée** (instantané),
pas liée dynamiquement. Une étude doit rester reproductible : son chiffrage ne doit pas bouger parce
que quelqu'un a modifié la bibliothèque entre-temps.

En contrepartie, afficher un indicateur : « la bibliothèque a évolué depuis l'instanciation
(3 composants diffèrent) » avec une action de resynchronisation explicite.

#### Capacité activable

Contrôlé par `sousOuvragesActives` (voir `10-genericite-multitenant.md`). Désactivé, l'UI ne propose
que des composants `ITEM` — le modèle reste identique.

### T4.3 — Capitalisation en ouvrage type *(le chemin manquant)*

Sur un article décomposé, action « Capitaliser en ouvrage type » :

```
POST /api/v1/etudes/ouvrages/depuis-dpu
     { prixDpuId, code, designation, categorie, notes }
     → Ouvrage créé avec ses ComposantOuvrage (rendement copié depuis ComposantDpu.rendement)
```

Règles :
- Les **rendements** sont capitalisés ; les **prix unitaires** le sont aussi mais avec
  `derniereMaj` daté (un prix vieillit, un rendement non)
- Si un ouvrage de même code existe : proposer de créer une **nouvelle version** plutôt qu'écraser
- Disponible uniquement sur une étude en statut `VALIDEE` — on ne capitalise pas un brouillon
- Tracer `dossierEtudeSourceId` sur l'ouvrage : savoir d'où vient un ratio

**Proposition automatique** : à la validation d'une étude, proposer la capitalisation des articles
décomposés qui n'existent pas encore en bibliothèque. Un écran, une liste, des cases à cocher. C'est
ce qui fera réellement grossir le corpus — un bouton isolé ne sera jamais cliqué.

### T4.4 — Rattachement au catalogue `item`

`CatalogResolverPort` et les champs `item_id` / `item_status` existent déjà mais ne sont exposés nulle
part — capacité morte.

Sur chaque composant :
- recherche dans le catalogue `item`
- si trouvé : `itemId` + `itemStatus = LINKED`, le PU peut se pré-remplir depuis le catalogue
  (`sourcePrix = CATALOGUE`)
- si absent : `itemStatus = TO_CREATE`, et proposer la création de l'article catalogue

Un indicateur en en-tête d'étape : « 12 composants non rattachés au catalogue ». Non bloquant, mais
visible — un composant non rattaché ne pourra pas être consulté au lot 5 ni suivi en achat.

### T4.5 — Suggestion de décomposition (préparation IA)

Câbler `DecompositionSuggestionPort` dans l'UI, en gardant l'implémentation `NoOp` :

- bouton « Proposer une décomposition » sur un article décomposable
- si le port est indisponible : bouton masqué (pas d'erreur)
- si disponible : les composants proposés apparaissent **en attente de validation**, visuellement
  distincts, avec `suggereParIa = true`
- l'utilisateur accepte / modifie / rejette ligne par ligne
- rien n'est persisté avant acceptation explicite

Ce contrat vaut pour toute suggestion IA du module. Le poser maintenant évite d'avoir à
rétro-adapter l'UI en phase 5.

### T4.6 — Performance

Le code actuel a des motifs à ne pas reproduire :
- `ConsultationNoeudService.nextOrdre()` recharge tout l'arbre pour compter des frères
- `deleteSubtree()` recharge tout l'arbre à chaque niveau de récursion
- `recalculatePostePricing()` refait un `findByNoeudId` à chaque mutation

Cibles : `SELECT MAX(ordre)` pour l'ordre, `WITH RECURSIVE` pour les sous-arbres, recalcul en
mémoire sur l'agrégat déjà chargé.

---

## Critères d'acceptation

- [ ] La colonne s'affiche « Rendement (par m³) », jamais « Quantité »
- [ ] Le déboursé sec affiché est bien unitaire, vérifié sur le cas béton B35
- [ ] Instancier un ouvrage type crée les composants avec les bons rendements
- [ ] Capitaliser une décomposition crée un `Ouvrage` réutilisable
- [ ] Aller-retour bibliothèque → étude → bibliothèque : rendements identiques
- [ ] La proposition de capitalisation apparaît à la validation d'une étude
- [ ] Le rattachement catalogue fonctionne et affiche le compteur de non-rattachés
- [ ] Aucun rechargement d'arbre complet lors d'une mutation de composant
- [ ] Un ouvrage composite (cloison → mortier → ciment) se calcule correctement sur 3 niveaux
- [ ] Un cycle A → B → A est refusé avec un message nommant le cycle
- [ ] Modifier le prix du ciment recalcule le mortier **et** la cloison
- [ ] Le rendement d'un sous-ouvrage affiche les deux unités (« 0,030 m³/m² »)
- [ ] `inclureFraisEtMarge` produit bien la marge en cascade sur un cas de sous-traitance
- [ ] Une étude instanciée ne bouge pas quand la bibliothèque change, mais le signale
