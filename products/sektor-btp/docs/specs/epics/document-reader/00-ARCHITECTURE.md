# Architecture — Document reader

> Le modèle cible du moteur d'import unifié. Le PLAN dit *pourquoi* et *dans quel ordre* ;
> ce document dit *quoi*. Les status sont dans `00-PROGRESS.md`.

---

## 1. La frontière

```
la plateforme lit  ·  le produit interprète
```

Ce qui est vrai pour n'importe quel tableau du monde monte en plateforme. Ce qui suppose de savoir
ce qu'est un lot, une unité ou un ICE reste dans Sektor.

Dépendance à **sens unique** : Sektor déclare (une définition, un assembleur, des validations), la
plateforme rend (des données, une carte des doutes). Aucune classe de la plateforme ne connaît
`DpgfNoeud` ; aucune classe de Sektor ne sait ce qu'est une empreinte de trame.

---

## 2. Le pivot

Aujourd'hui le type pivot du pipeline est du **texte aplati** : on détruit la grille, puis on paie
un modèle pour la reconstruire. Demain le pivot est la **grille** — lignes × cellules, avec les
signaux de style (fusion, casse, taille, couleur) que le texte perd irrémédiablement.

Conséquence non évidente : le dépivotage d'une matrice (colonnes = jours, colonnes = fournisseurs)
devient possible. Sur du texte aplati il ne l'est pas — la position d'une cellule dans sa colonne
est perdue, donc la dimension est perdue.

### 2.1 La sonde

Elle ne regarde pas l'extension mais le contenu. Un `.pdf` sort par trois portes :

| Porte | Signal | Source |
|---|---|---|
| pdf quadrillé | filets vectoriels | `PdfRuledGridSource` |
| pdf texte | couche texte, pas de filets | analyse géométrique |
| scan | ni filets ni texte | vision (palier 4) |
| tableur | xlsx, csv, docx | `XlsxGridSource`, à compléter |

---

## 3. Deux lecteurs, un seul plan

La grille ne contient pas tout. Dans un BL, `blReference`, `date`, `sender.name` sont posés en vrac
dans la page, repérés par une étiquette voisine — le lecteur de grille ne les verra jamais.

| Lecteur | Lit | Pour |
|---|---|---|
| **lecteur d'ancres** | étiquette puis valeur, par position relative | champs de tête, blocs d'adresse |
| **lecteur de grille** | cellule par cellule | collections, lignes |

Les deux compilent dans le **même** `ReadingPlan` et partagent le **même** cache. C'est là que le
cache par trame vaut le plus cher : un fournisseur pose toujours son numéro de BL au même endroit
de la même mise en page — le premier document compile les ancres, tous les suivants coûtent zéro
appel, en-tête comprise.

Le volet `ancres` est **déclaré dès le lot 1 et implémenté en vague 2**. Vide, pas absent.

---

## 4. Les six formes

| Forme | Exemples | Hiérarchie | Collections |
|---|---|---|---|
| fiche | contrat, attestation | aucune | 0 |
| liste | clients, articles, prix | aucune | 1 |
| tête + lignes | facture, BL, commande, devis | 1 niveau | 1 |
| arbre | bordereau, nomenclature | n niveaux | 1 |
| blocs multiples | CPS, bilan, liasse | variable | n |
| matrice | pointage, comparatif fournisseurs | aucune | 1 + dépivotage |

Les quatre premières ne sont pas quatre mécanismes : ce sont des réglages du même contrat. Zéro
niveau donne la fiche et la liste, un niveau la tête et ses lignes, n niveaux l'arbre.

La **fiche n'est pas une forme rare** : c'est un composant qui se compose. `reception-bl.schema.ts`
le démontre déjà — trois sections de tête (`Header`, `Sender`, `Receiver`, sept champs scalaires)
plus une collection `items`, et un `presentationSchema` qui sépare `sections` de `arrays`.

---

## 5. Les contrats

### 5.1 `ReadingPlan` — comment lire ce fichier

Typé et borné. **Jamais du code généré.** Attaché à une *trame*, mis en cache par empreinte.

```
ReadingPlan
  source            feuille / pages, où commence le tableau
  ancres            étiquette → champ, par position relative   (vide en vague 1)
  colonnes          indice → champ du dataSchema
  classesDeLignes   les natures de lignes et leurs signaux
  hiérarchie        aucune | rangs ordonnés appris
  dépivotage        réservé, non résolu en vague 1
```

Même structure pour tous les documents, remplie autrement :

| Champ | table clients | bordereau |
|---|---|---|
| colonnes | raison sociale, ICE, ville | code, désignation, unité, quantité |
| classesDeLignes | `{ enregistrement }` | `{ lot, sous-lot, article, décor, continuation }` |
| hiérarchie | aucune | rangs `{ROMAN, LETTER}` ou `{NUM1, NUMN}` |

**Le spécifique est une donnée, pas une branche de code.** C'est ce qui permet au cache d'exister :
ce qui est mis en cache, c'est ce tableau-là.

### 5.2 `ExtractionDefinition` — quoi extraire

Existante, à faire évoluer sans migration :

| Évolution | Quand | Pourquoi |
|---|---|---|
| `arrayPaths` au pluriel | **lot 1** | un CPS, un bilan ont plusieurs collections |
| volet `ancres` déclaré | **lot 1** | la vague 2 ne doit pas rouvrir le contrat |
| `hiérarchie` (remplace « forme ») | lot 2 | ce n'est pas un format de sortie, c'est « faut-il déduire une parenté » |
| `dépivotage` nommé | lot 1 | réservé pour la matrice |

**Objet à la racine, toujours.** Jamais un tableau nu : le jour où une liste de clients gagne une
date d'export ou une société émettrice, un tableau racine ne peut pas l'accueillir — c'est une
porte à sens unique. Une liste est « en-tête vide + collection ». `dataSchema` + `arrayPath` fait
déjà le bon choix ; il faut seulement le pluriel.

---

## 6. Les trois points d'extension

Un import « standard » est le cas où les trois prennent leur valeur par défaut.

| # | Point | Défaut plateforme | Bordereau |
|---|---|---|---|
| 1 | classes de lignes | une seule classe | cinq classes |
| 2 | hiérarchie | aucune | rangs appris |
| 3 | validations métier | aucune | unité, quantité, codes frères |

Et une **projection finale**, côté Sektor uniquement : traduire le nœud générique
(`rang`, `code`, `libellé`, `cellules`, `parent`) en `DpgfNoeud`, et tenir la double numérotation —
référence marché verbatim d'un côté, numéro d'arbre dérivé de la position de l'autre. Aucune
plateforme ne peut deviner ça, et ça ne doit pas y monter.

---

## 7. La cascade, le validateur, le cache

```
heuristique  →  cache  →  ia compile  →  vision
      └──────────┴────────────┴───────────┘
                 un seul validateur
```

On ne descend d'un palier que si le validateur **refuse** le plan proposé. Le modèle n'apparaît
qu'aux paliers 3 et 4, il ne touche jamais les données, et son plan n'existe qu'une fois validé.
L'exécution en dessous ne fait aucun appel : même fichier, même plan, même sortie.

Le chemin LLM actuel (`StatelessExtractionService`) **n'est pas supprimé** : il devient les paliers
3 et 4.

---

## 8. La carte des doutes

Deux natures, **jamais fusionnées dans l'écran** :

| Nature | Sens | Volume observé |
|---|---|---|
| doute d'extraction | « on n'est pas sûr d'avoir bien lu » | rare — 4 postes sur BDP-2-17, 3 sur Villa, 11 sur `bdp.xlsx` |
| manque de la source | « le fichier ne le contient pas » | parfois massif — 75 quantités absentes sur Villa Kenitra |

Les afficher ensemble annoncerait « 39 % à revoir » sur Villa Kenitra : alarmant et faux.

Principe : **on ne répare pas un fichier mal saisi, on le signale.** Le travail de l'extraction est
de mener l'utilisateur aux bons endroits, et seulement à ceux-là. Une alerte qui crie au loup en
discrédite mille — voir les deux détecteurs resserrés dans `docs/extraction/README.md`.

Une parenté fausse n'est pas une cellule fausse : elle change le sens des lignes en dessous. Deux
gestes de correction différents, donc deux composants — `smart-import-data-table` et
`smart-import-tree-table`, tous deux existants.

---

## 9. Les trois modes de consommation

Seul endroit où Sektor décide, et aucun des trois ne remonte quoi que ce soit dans le moteur.

| Mode | Écrans | Effet |
|---|---|---|
| alimenter une liste | clients, fournisseurs, employés, articles, ouvrages | handler — `created` / `skippedDuplicates` |
| remplir un document | réception BL (+ facture, offre fournisseur) | `form.patchValue` — aucune création |
| construire un arbre | lots de chantier, bordereau d'étude | handler — deux passes, parents d'abord |

Le deuxième mode n'est pas un import mais un **rapprochement** : aligner les lignes lues sur celles
d'une commande existante. Problème métier, pas problème de lecture — d'où son lot propre en vague 2.

---

## 10. Placement

| Brique | Où |
|---|---|
| sondes, grille, cascade, validateur, cache, exécuteur | `platform/backend/features/documents/` |
| écran de relecture, composants table / arbre | `platform/web/features/documents/smart-import/` |
| paliers 3 et 4 (modèle, vision) | `platform/backend/features/documents/doc-extractor/` |
| définitions d'extraction | `products/sektor-btp/web/app/shared/extraction-schemas/` |
| handlers | `products/sektor-btp/web/app/shared/smart-import/handlers/` |
| assembleur bordereau, projection `DpgfNoeud` | `products/sektor-btp/backend/modules/etudes/…/bordereau/` |
| validations métier | modules Sektor concernés |

---

## 11. Décisions actées

| # | Décision | Justification |
|---|---|---|
| **D1** | Le pivot du pipeline est la grille, pas le texte aplati | Tout ce qu'on importe est tabulaire ; aplatir puis reconstruire au modèle est un aller-retour perdant. 703 articles / 4 fichiers / 0 appel contre 17 appels par document |
| **D2** | L'IA compile un plan typé et borné ; elle ne lit jamais les données | Rend le résultat reproductible et cachable. Jamais de code généré |
| **D3** | Un validateur unique entre chaque palier et le plan retenu | Un seul endroit où « le plan est-il acceptable » est défini ; sinon quatre définitions divergentes |
| **D4** | Le moteur vit en capability plateforme | Lire une grille n'est pas du métier BTP. `docs/AGENTS.md` règle 5 |
| **D5** | Le chemin LLM actuel devient les paliers 3 et 4 | Aucune régression possible sur les scans et les documents sans grille |
| **D6** | Objet à la racine, toujours ; `arrayPaths` au pluriel dès le lot 1 | Un tableau racine est une porte à sens unique |
| **D7** | Deux lecteurs, un seul plan, un seul cache ; volet `ancres` déclaré dès le lot 1 | La vague 2 ne doit pas rouvrir le contrat |
| **D8** | Trois points d'extension ; l'import plat est leur configuration par défaut | Le cas simple doit être le cas dégénéré du cas complexe, pas une branche séparée |
| **D9** | Deux natures de doutes, jamais fusionnées | Les mélanger produit un chiffre alarmant et faux |
| **D10** | La bascule se fait par forme, pas par écran | Chaque forme a sa mesure ; écran par écran on perd les deux étalons |
| **D11** | Cache de plans par empreinte de trame | Le deuxième fichier d'un même émetteur coûte zéro appel. Portée = **O1** |
| **D12** | Aucune écriture sans relecture | Contrat déjà tenu par `SmartImportTrigger.completed` |
| **D13** | Les 703 articles sur 4 fichiers sont le test de non-régression du lot 0 | C'est le seul étalon chiffré du dépôt ; le perdre, c'est déménager à l'aveugle |

---

## 12. Ce que l'architecture ne prévoit pas

- **Connecteurs vers un ERP tiers** — hors périmètre, ici on lit des fichiers.
- **Correction automatique d'un fichier mal saisi** — on signale, on ne répare pas.
- **Un doc type par fichier** — la découverte, quand elle viendra, propose les colonnes réelles du
  document, pas un modèle métier inventé. Sans ça la bibliothèque de schémas devient inexploitable.
- **90 % d'extractions justes sans relecture** — les six formes couvrent 90 % des documents *en
  forme*. La promesse tenable est différente et mesurable : n'importe quel document arrive à
  l'écran de relecture avec ses doutes correctement localisés.
