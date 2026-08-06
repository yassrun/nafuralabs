# Refonte de la classification article

**Statut** : **terminé** Lots 1–5 + **ERP-25** lots d’usage multi (ADR §7.4) · migrate staging 05/08
**Périmètre** : `products/sektor-btp/backend/modules/item/`,
`products/sektor-btp/backend/app/src/main/java/ma/nafura/erp/onboarding/`,
`products/sektor-btp/web/app/pages/inventory/`, `products/sektor-btp/web/app/inventory/`
**Objectif** : ramener la classification d'un article de trois axes concurrents à deux axes
disjoints — une nature verrouillée qui pilote le comportement système, et une famille libre qui
ne sert qu'au classement.

---

## 1. Constat

Un article porte aujourd'hui trois classements qui répondent à la même question.

| Axe | Support | Éditable | Valeurs |
|---|---|---|---|
| `items.article_type` | colonne texte, valeurs en dur | non | `MATIERE`, `CONSOMMABLE`, `MATERIEL`, `MAIN_DOEUVRE`, `SERVICE`, `SOUS_TRAITANCE` |
| `item_types` | table par tenant | oui | `MATERIAU`, `CONSOMMABLE`, `EQUIPEMENT`, `PRESTATION` |
| `item_categories` | table par tenant | oui | `GROS_OEUVRE`, `VRD`, `FINITIONS`, `EPI` |

Trois défauts vérifiés dans le code :

**1.1 — Le front et le back n'ont pas le même enum.**
`web/app/inventory/models/index.ts:7` déclare `'MATERIAU' | 'CONSOMMABLE' | 'ENGIN' | 'OUTILLAGE'`.
`backend/.../item/domain/ArticleType.java` déclare `MATIERE`, `CONSOMMABLE`, `MATERIEL`,
`MAIN_DOEUVRE`, `SERVICE`, `SOUS_TRAITANCE`. Seul `CONSOMMABLE` est commun.
Conséquence : `MAIN_DOEUVRE` et `SOUS_TRAITANCE` ne sont pas saisissables depuis l'écran article
(`pages/inventory/catalogue/articles/config/detail/fields.ts:47-50`), alors que le back les attend
pour le mapping DPU. Sans elles, pas de déboursé sec complet.

**1.2 — La colonne « Famille article » de l'écran « Types d'articles » est un artefact.**
`item_types` n'a pas de colonne `article_type` en base
(`item/src/main/resources/db/changelog/schema/v1.0/003_create_item_types.sql`). Le front la fabrique
depuis le code du type, avec repli sur `MATERIAU` :

```ts
// configuration/types-articles/services/type-article.facade.ts:18
return ARTICLE_TYPES.has(code as ArticleType) ? (code as ArticleType) : 'MATERIAU';
```

D'où l'affichage « Matériau » sur les lignes `EQUIPEMENT` et `PRESTATION`.

**1.3 — Les familles mélangent deux nomenclatures.**
`EPI` est une famille d'approvisionnement, `GROS_OEUVRE` / `VRD` / `FINITIONS` sont des lots
d'ouvrage. Un casque de chantier appartient aux deux, donc le classement devient arbitraire dès que
le catalogue grossit. Par ailleurs `item_categories.parent_id` existe en base mais n'est alimenté
nulle part : `TenantReferenceDataSeedService.seedItemCategories()` (ligne 139) l'ignore.

---

## 2. Modèle cible

Deux axes, un seul critère de découpage :

- **Nature** — verrouillée, non éditable par le tenant. Une nature n'existe que si elle change un
  comportement système : stockable ou non, valorisée ou non, poste budget par défaut, type DPU. Si
  deux valeurs se comportent identiquement, c'est une famille, pas une nature.
- **Famille** — arbre libre à deux niveaux, éditable, **zéro comportement**. Sert au classement, aux
  filtres et au reporting achat.

Décision structurante : **la nature ne se seede pas**. C'est un enum Java exposé en lecture seule par
un endpoint. Pas de table, pas de seed, donc pas de dérive possible entre le code et la donnée —
c'est exactement le défaut 1.2 qu'on élimine à la racine.

`item_types` disparaît.

### 2.1 Convention de famille

La famille désigne la **famille d'approvisionnement** — ce qu'on achète — et non le lot d'ouvrage où
l'article se pose. Le lot se déduit de l'ouvrage qui consomme l'article ; il n'a rien à faire sur la
fiche article.

---

## 3. Valeurs de référence

### 3.1 Les 9 natures — enum Java, aucun seed

| Code | Libellé | Stockable | Valorisé | UoM déf. | Poste budget | Type DPU |
|---|---|---|---|---|---|---|
| `MATIERE` | Matière | oui | oui | — | `MATERIAUX` | `MATIERE` |
| `CONSOMMABLE` | Consommable | oui | oui | `U` | `MATERIAUX` | `MATIERE` |
| `CARBURANT` | Carburant | oui | oui | `L` | `CARBURANT` | `MATIERE` |
| `OUTILLAGE` | Outillage | oui, retour attendu | oui | `U` | `MATERIEL` | `MATERIEL` |
| `MATERIEL` | Matériel en propre | non | non | `H` | `MATERIEL` | `MATERIEL` |
| `LOCATION` | Location matériel | non | non | `H` | `LOCATION_MATERIEL` | `MATERIEL` |
| `MAIN_DOEUVRE` | Main d'œuvre | non | non | `H` | `MO` | `MAIN_DOEUVRE` |
| `SOUS_TRAITANCE` | Sous-traitance | non | non | `LOT` | `SOUS_TRAITANCE` | `SOUS_TRAITANCE` |
| `SERVICE` | Service externe | non | non | `U` | `FRAIS_GENERAUX` | `SOUS_TRAITANCE` |

Justification des quatre natures nouvelles :

- `CARBURANT` — poste budget dédié déjà présent dans l'enum `posteBudget`, suivi par engin, une des
  premières lignes de coût d'un chantier de terrassement. Noyé dans `MATIERE`, le contrôle gasoil est
  impossible.
- `OUTILLAGE` — part au chantier et **revient**. Une pelle sortie n'est pas consommée. Comportement
  de mouvement différent de `CONSOMMABLE`.
- `LOCATION` — coût horaire facturé par un tiers, à distinguer de l'amortissement d'un engin en
  propre. `NatureComposantMapping:39` écrase aujourd'hui `LOCATION` et `OUTILLAGE` sur le même
  `MATERIEL`, l'information est perdue au chiffrage.
- `MAIN_DOEUVRE` — existe côté back, absente côté front. C'est le trou qui empêche le déboursé sec.

### 3.2 Les familles — 25 racines, 35 sous-familles (60 au total)

| Racine | Libellé | Sous-familles |
|---|---|---|
| `LIANTS` | Liants | `CIMENT`, `CHAUX_PLATRE` |
| `GRANULATS` | Granulats | `SABLE`, `GRAVIER`, `TOUT_VENANT` |
| `BETON_MORTIER` | Bétons et mortiers | `BPE`, `MORTIER_COLLE`, `ADJUVANT` |
| `ACIER` | Aciers | `ROND_BETON`, `TREILLIS`, `PROFILE_METAL` |
| `MACONNERIE` | Maçonnerie | `AGGLO`, `BRIQUE`, `HOURDIS` |
| `BOIS_COFFRAGE` | Bois et coffrage | — |
| `ETANCHEITE_ISOLATION` | Étanchéité et isolation | — |
| `REVETEMENT` | Revêtements | — |
| `PEINTURE_ENDUIT` | Peintures et enduits | — |
| `MENUISERIE` | Menuiserie et serrurerie | `MENUISERIE_BOIS`, `MENUISERIE_ALU_PVC`, `SERRURERIE` |
| `PLOMBERIE_SANITAIRE` | Plomberie et sanitaire | — |
| `ELECTRICITE` | Électricité | `CABLE`, `APPAREILLAGE`, `ECLAIRAGE` |
| `CVC` | Chauffage, ventilation, climatisation | — |
| `VRD_RESEAUX` | VRD et réseaux | `CANALISATION`, `REGARD_BORDURE` |
| `QUINCAILLERIE` | Quincaillerie et fixations | — |
| `EPI` | Équipements de protection individuelle | — |
| `CONSO_CHANTIER` | Consommables chantier | — |
| `CARBURANT_LUBRIFIANT` | Carburants et lubrifiants | — |
| `OUTILLAGE_FAM` | Outillage | `OUTILLAGE_MANUEL`, `OUTILLAGE_ELECTRO` |
| `ENGIN` | Engins | `ENGIN_TERRASSEMENT`, `ENGIN_LEVAGE`, `ENGIN_COMPACTAGE`, `ENGIN_TRANSPORT` |
| `ECHAFAUDAGE_ETAIEMENT` | Échafaudage et étaiement | — |
| `SIGNALISATION_SECURITE` | Signalisation et sécurité chantier | — |
| `MAIN_DOEUVRE_FAM` | Main d'œuvre | `MO_ENCADREMENT`, `MO_QUALIFIEE`, `MO_SPECIALISEE`, `MO_MANOEUVRE` |
| `SOUS_TRAITANCE_FAM` | Sous-traitance | `ST_GROS_OEUVRE`, `ST_SECOND_OEUVRE`, `ST_TECHNIQUE` |
| `SERVICE_EXTERNE` | Services externes | — |

Libellés des sous-familles à écrire en toutes lettres dans le JSON (« Rond à béton », « Treillis
soudé », « Ouvrier qualifié », etc.).

### 3.3 Unités — une correction

Les 14 unités actuelles conviennent, sauf une inversion à corriger :
`reference-data.json:15-16` définit `ML` = millilitre et `M` = mètre linéaire. Dans un devis BTP,
`ML` **est** le mètre linéaire ; un métreur qui saisit du linéaire de bordure obtiendrait des
millilitres. Corriger maintenant, avant qu'il y ait de la donnée client réelle.

| Catégorie | Unités cibles |
|---|---|
| `MASSE` | `T`, `KG`, `G` |
| `VOLUME` | `M3`, `L`, `MLT` (millilitre, renommé) |
| `LONGUEUR` | `ML` (mètre linéaire), `M2`, `CM` |
| `COMPTAGE` | `U`, `EA`, `LOT` |
| `TEMPS` | `H`, `J` |

---

## 4. Lots d'exécution

Ordre imposé : chaque lot doit compiler et passer les tests avant le suivant.

### Lot 1 — La nature devient un vrai enum

**Fichiers**

- `backend/modules/item/src/main/java/ma/nafura/item/domain/ArticleType.java` → remplacer la classe
  de constantes `String` par un `enum Nature` portant ses attributs : `libelle`, `stockable`,
  `valorise`, `uomDefaut`, `posteBudgetDefaut`, `typeDpu`.
- `.../item/domain/NatureComposantMapping.java` → étendre le `switch` aux 4 natures nouvelles ;
  supprimer l'écrasement `LOCATION`/`OUTILLAGE` → `MATERIEL` en les mappant chacune.
- `.../item/domain/model/Item.java` → renommer le champ `articleType` en `nature`.
- `.../item/api/request/ItemCreateDto.java`, `ItemUpdateDto.java` → même renommage, plus validation
  contre l'enum (rejet 400 sur valeur inconnue, pas de repli silencieux).
- `.../item/service/ItemService.java` → dériver `posteBudgetId` de la nature à la création quand il
  n'est pas fourni.
- Nouveau `.../item/api/controller/NatureController.java` → `GET /api/v1/article-natures`, renvoie
  code, libellé et les flags. Lecture seule, pas de POST/PUT/DELETE.
- Nouveau changelog SQL : renommer `items.article_type` en `items.nature`, élargir à
  `VARCHAR(30)` si besoin, réindexer (`idx_items_article_type` → `idx_items_nature`).

**Conserver** `ArticleType.LEGACY_MATERIAU` et la logique `normalize()` sous forme de méthode
`Nature.fromLegacy(String)` — les données existantes contiennent `MATERIAU`.

**Fin de lot** : `NatureComposantMappingTest` passe avec des cas pour les 9 natures.

### Lot 2 — Suppression d'`item_types`

**Supprimer côté back**

```
backend/modules/item/src/main/java/ma/nafura/item/domain/model/ItemType.java
                                     .../repository/ItemTypeRepository.java
                                     .../mapper/ItemTypeMapper.java
                                     .../service/ItemTypeService.java
                                     .../service/base/ItemTypeServiceBase.java
                                     .../api/controller/ItemTypeController.java
                                     .../api/controller/base/ItemTypeControllerBase.java
                                     .../api/request/ItemTypeCreateDto.java
                                     .../api/request/ItemTypeUpdateDto.java
backend/modules/item/src/main/resources/validation/item-type.validation.json
```

**Supprimer côté front**

```
web/app/pages/inventory/configuration/types-articles/     (écran vivant, routé)
web/app/pages/inventory/configuration/item-types/         (arbre mort, sert seulement d'API au précédent)
web/app/pages/inventory/catalogue/items/                  (arbre mort, doublon de catalogue/articles)
web/public/assets/validation/item-type.validation.json
```

**Nettoyer les références**

- `web/app/inventory/inventory.routes.ts:383` — retirer la route `configuration/types-articles`.
- `web/app/shared/config/erp-lookup-list-routes.ts`, `erp-lookup-create-routes.ts` — retirer les
  entrées de lookup.
- `web/app/routes/erp.routes.generated.ts`, `web/app/shell/erp-nav.generated.ts` — fichiers générés,
  régénérer plutôt qu'éditer à la main.
- `web/public/assets/i18n/applications/erp/inventory/{fr,en,ar}.json` — retirer le bloc
  `inventory.configuration.typeArticle`.
- `web/public/assets/i18n/item/{fr,en,ar}.json` — retirer les clés `itemType`.
- Colonne `items.item_type_id` : la **conserver** jusqu'au Lot 5 (migration des données), la
  supprimer ensuite par changelog.

**Fin de lot** : plus aucune occurrence de `ItemType` / `typeArticle` (écrans + API).  
`items.item_type_id` / `Item.itemTypeId` **conservés** jusqu'au Lot 5.

### Lot 3 — Familles en arbre

- `backend/app/src/main/resources/onboarding/reference-data.json` → remplacer le bloc
  `itemCategories` par les **60** entrées de §3.2, chacune avec un `parentCode` optionnel ;
  corriger les unités selon §3.3.
  (`itemTypes` déjà retiré en Lot 2.)
- `backend/app/src/main/java/ma/nafura/erp/onboarding/service/TenantReferenceDataSeedService.java` :
  - `seedItemCategories()` en deux passes — insérer d'abord les entrées sans `parentCode`, puis
    résoudre `parentCode` → `parentId` via une map code → id, exactement comme
    `categoryIdsByCode()` le fait déjà pour les unités de mesure.
  (`seedItemTypes` déjà retiré en Lot 2.)
- L'idempotence est déjà assurée par `existsItemCategory()` : rejouer l'onboarding n'écrase rien.
- Écran Familles (`pages/inventory/configuration/familles/`) : afficher l'arbre, permettre de choisir
  un parent à la création.

**Fin de lot** : un tenant fraîchement seedé a **60** familles dont **35** rattachées à un parent.

### Lot 4 — Front aligné

- `web/app/inventory/models/index.ts:7` — remplacer le type `ArticleType` par les 9 natures du back.
  C'est la source de la divergence, à corriger en premier.
- `pages/inventory/catalogue/articles/config/detail/fields.ts` — alimenter le select depuis
  `GET /api/v1/article-natures` au lieu de la liste en dur (lignes 47-50), et rendre
  `posteBudgetId` en lecture seule avec la valeur dérivée de la nature, modifiable seulement en
  dérogation explicite.
- `pages/inventory/catalogue/articles/config/listing/{columns,filters}.ts` — renommer `articleType`
  en `nature`, adapter les variantes de badge aux 9 valeurs.
- `web/app/inventory/services/{item-article.mapper,article-catalog,inventory-lookups}.service.ts` —
  renommage.
- `web/app/pages/inventory/mouvements/{sorties,transferts,retours,pertes-chutes}/services/*.facade.ts`
  — renommage.
- `web/app/shared/extraction-schemas/article.schema.ts` et
  `web/app/shared/smart-import/handlers/article-import.handler.ts` — mettre à jour les valeurs
  acceptées à l'import.
- `web/app/pages/etudes/dossiers/components/create-missing-item-dialog/` — le dialogue de création
  d'article depuis le chiffrage doit proposer les 9 natures.
- i18n `inventory.enums.articleType.*` → `inventory.enums.nature.*`, 9 clés dans les trois langues.

**Fin de lot** : créer un article de nature `MAIN_DOEUVRE` depuis l'écran article fonctionne
de bout en bout.

### Lot 5 — Rattachement du matériel

`materiels` est aujourd'hui une table isolée : son `famille_id` est un `VARCHAR(50)` libre, sans lien
vers `item_categories`, et rien ne la relie à `items`.

- Ajouter `materiels.item_id UUID` → l'article de nature `MATERIEL` qui représente l'engin au
  catalogue, et `materiels.item_category_id UUID` en remplacement de `famille_id`/`famille_name`.
- `.../item/domain/model/Materiel.java`, `MaterielCreateDto`, `MaterielUpdateDto`,
  `MaterielService` — adapter.
- Règle métier : un engin possède une fiche `materiels` **et** une ligne `items` de nature
  `MATERIEL`. Le catalogue porte le coût horaire, la fiche porte le n° de série et la maintenance.

**Fin de lot** : `MaterielServiceTest` couvre la création liée à un article.

---

## 5. Migration des données existantes

Volume faible aujourd'hui — c'est le bon moment.

### 5.1 `article_type` → `nature`

| Valeur existante | Nature cible |
|---|---|
| `MATERIAU` (legacy) | `MATIERE` |
| `MATIERE` | `MATIERE` |
| `CONSOMMABLE` | `CONSOMMABLE` |
| `MATERIEL` | `MATERIEL` |
| `MAIN_DOEUVRE` | `MAIN_DOEUVRE` |
| `SOUS_TRAITANCE` | `SOUS_TRAITANCE` |
| `SERVICE` | `SERVICE` |
| `NULL` | `MATIERE` |

### 5.2 `item_type_id` → nature

Les 4 types seedés se traduisent ainsi :

| Code `item_types` | Nature |
|---|---|
| `MATERIAU` | `MATIERE` |
| `CONSOMMABLE` | `CONSOMMABLE` |
| `EQUIPEMENT` | `MATERIEL` |
| `PRESTATION` | `SOUS_TRAITANCE` (défaut) — voir ADR §7.2 |

`PRESTATION` est décrit « Prestations et sous-traitance » dans le seed. Inventaire staging
2026-08-05 : **0** article lié. Défaut migration = `SOUS_TRAITANCE` ; checklist manuelle si des
lignes apparaissent avant Lot 2 (ADR).

En cas de contradiction entre `article_type` et `item_type_id` sur un même article, `article_type`
fait foi — c'est lui que consomme le chiffrage.

### 5.3 Familles

Les 4 familles existantes (`GROS_OEUVRE`, `VRD`, `FINITIONS`, `EPI`) ne se traduisent pas
mécaniquement vers la nouvelle nomenclature : trois sont des lots d'ouvrage. Seule `EPI` se retrouve
telle quelle. Décision : conserver les 4 anciennes en inactif, réaffecter les articles à la main.

---

## 6. Hors périmètre

- Suppression de `items.prix_unitaire`, déjà marquée `@Deprecated(since = "lot-9")` — traitée
  ailleurs, ne pas y toucher ici.
- Refonte de l'écran Familles au-delà de l'affichage hiérarchique.
- Sous-familles de niveau 3.
- Bibliothèque de prix et résolution de prix (`service/prix/`).

---

## 7. Questions ouvertes — tranchées (ERP-19)

Détail : [`01-ADR-decisions-ouvertes.md`](./01-ADR-decisions-ouvertes.md).

**7.1 — `SERVICE` dans le DPU** → `DPU_SOUS_TRAITANCE` (budget reste `FRAIS_GENERAUX`). Pas de 5ᵉ
poste DPU pour Lot 1 ; revisiter au chainage aval si besoin de colonnes distinctes.

**7.2 — Articles `PRESTATION`** → défaut nature `SOUS_TRAITANCE` si `article_type` absent ;
`article_type` gagne en conflit. Staging aujourd'hui : 0 ligne à reprendre.

**7.3 — Migrations SQL** → Liquibase Job K8s (`:tools:lifecycle:collectMigrations`), SQL sous
`modules/*/…/db/changelog/`. Pas de Flyway/Liquibase Spring sur sektor.
