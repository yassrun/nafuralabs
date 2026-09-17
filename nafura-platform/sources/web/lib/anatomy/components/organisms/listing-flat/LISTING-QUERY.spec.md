# Spec — Listing Query Platform (+ PlatformEntity)

Status: Phase A–C shipped (sandbox + framework API)  
Scope: `nafura-platform` (Anatomy front + Framework back)  
Demo de référence: `http://localhost:4300/archetypes/listing`

### Livraison récente

- **Phase B** : `query` / `queryChange`, tri data-table, multiselect + daterange (filter-builder + pinned), hydration URL sandbox, mode `remote` opt-in.
- **Phase C** : table `listing_saved_views`, API `/api/v1/listing-views`, UI « Views » + adapter localStorage sandbox (`resourceKey=sandbox-products`).
- **Phase A gap** : `TenantEntity` renseigne `createdBy` / `updatedBy` depuis `UserContext` au persist/update.

## 1. Problème

Le listing plat (`nf-listing-flat`) est un bon **organisme UI** (toolbar, chips, sélection, colonnes, export local), mais il n’est pas encore un **contrat ERP** :

- filtres = `Record<string, unknown>` + égalité stricte côté client
- types déclarés (`multiselect`, `daterange`) non rendus
- pas de tri branché sur le listing flat
- état search/filter/page local, non hydratable / non deep-linkable
- `initialFilters` n’est pas une saved view
- côté serveur, `CrudController.list` ne comprend que `page/size/sort/search` — pas de filtres à opérateurs

En parallèle, **il n’existe pas d’entité abstraite platform**. Chaque modèle répète `id`, `tenantId`, `createdAt`, `updatedAt`, `@PrePersist/@PreUpdate`. On a :

| Couche | Existe | Manque |
|---|---|---|
| Repo | `TenantScopedRepository` | — |
| Audit | `@Auditable` (opt-in journal) | champs audit standard sur l’entité |
| CRUD | `CrudService` / `JpaCrudService` | query filtres structurés |
| JPA model | — | `PlatformEntity` / `TenantEntity` `@MappedSuperclass` |

Sans base entity, impossible d’avoir des filtres/scopes génériques fiables (`createdAt between`, `createdBy = me`, soft-delete, etc.) sur **toutes** les listes.

## 2. Réponse courte : front + back ?

**Oui — les deux**, mais pas en un seul lot.

| Capacité | Front | Back | Pourquoi |
|---|---|---|---|
| `ListingQueryState` + opérateurs | oui | oui | même contrat TS ↔ Java |
| Rendu filtres (`multiselect`, `daterange`, ops) | oui | — | UI only |
| Mode local vs remote même composant | oui | — | adapter sur `items` ou `load(query)` |
| Deep-link URL / hydration | oui | — | router query params |
| Exécution filtres serveur (Spec JPA) | — | oui | sinon faux ERP dès > quelques centaines de lignes |
| Saved views perso | oui | oui | persistées, partageables plus tard |
| `PlatformEntity` | — | oui | fondation modèle ; front consomme les champs standards |

**Règle :** le front peut avancer en mode local avec le même contrat query. Le back doit rattraper avant de brancher les vrais facades métier.

## 3. Objectifs

1. Un **objet query canonique** partagé platform.
2. Un listing **server-first capable**, local compatible.
3. Des **saved views** (perso en V1).
4. Une **base entity JPA** commune pour les entités tenant-scoped.
5. Éliminer le fossé `listing-flat` (UI) vs `entity-listing` (facade) en faisant converger sur le même état.

## 4. Non-objectifs (V1)

- Groupes OR complexes / query builder type Salesforce
- Saved views partagées / défaut par rôle (V2)
- Faceted counts
- Select-all-matching-query serveur (préparer le hook, pas livrer)
- Soft-delete complet + archive UI (prévoir le champ, pas le produit)
- Refonte visuelle toolbar hors besoin query

## 5. Fondation back — `PlatformEntity`

### 5.1 Pourquoi c’est lié au listing

Les ERP filtrent presque toujours sur des champs **transverses**. Sans superclass, chaque service réinvente les colonnes et les Criteria.

### 5.2 Proposition

```text
PlatformEntity<TId>          // id + createdAt + updatedAt (+ optional version)
  └── TenantEntity           // + tenantId (+ optional createdBy / updatedBy)
```

Implémentation : `@MappedSuperclass` dans `core/framework` (pas dans un module métier).

Champs V1 recommandés :

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| `id` | `UUID` | oui | `@GeneratedValue` |
| `tenantId` | `UUID` | oui sur `TenantEntity` | aligné `TenantScopedRepository` |
| `createdAt` | `OffsetDateTime` | oui | `@PrePersist` |
| `updatedAt` | `OffsetDateTime` | oui | `@PrePersist` / `@PreUpdate` |
| `createdBy` | `UUID` nullable | recommandé | user id ; scope « mine » |
| `updatedBy` | `UUID` nullable | optionnel V1 | |
| `version` | `Long` `@Version` | optionnel | optimistic lock |
| `deletedAt` | `OffsetDateTime` | **réservé, pas activé** | soft-delete V2 |

### 5.3 Migration

Lab mode : **pas de dual-write zombie**.

1. Introduire les `@MappedSuperclass`.
2. Migrer progressivement les entités platform (pas Sektor métier dans ce lot).
3. Liquibase : aligner colonnes si noms divergent (`created_at`, `tenant_id`, …).
4. Ne pas forcer les agrégats / tables système atypiques.

Critère de done fondation : ≥ 1 entité CRUD réelle étend `TenantEntity` + list query générique fonctionne dessus.

## 6. Contrat canonique — `ListingQueryState`

### 6.1 Modèle (TS + miroir Java)

```ts
type FilterOperator =
  | 'eq' | 'ne'
  | 'contains' | 'startsWith'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'in' | 'between'
  | 'isEmpty' | 'isNotEmpty';

interface FilterClause {
  field: string;
  op: FilterOperator;
  value?: unknown; // scalar | array | [from, to]
}

type ListingScope = 'all' | 'mine' | 'archived'; // archived = V2 si soft-delete

interface ListingSort {
  field: string;
  direction: 'asc' | 'desc';
}

interface ListingColumnState {
  key: string;
  visible: boolean;
  // V1.1: width?, frozen?, order?
}

interface ListingQueryState {
  search?: string;
  filters: FilterClause[];      // AND only in V1
  sort?: ListingSort | null;
  page: number;                 // 1-indexed côté Anatomy
  pageSize: number;
  scope?: ListingScope;
  columns?: ListingColumnState[];
}
```

### 6.2 Sérialisation transport

- **API list** : query params structurés (ex. `filter=status:eq:Active&filter=category:in:A,B&filter=createdAt:between:2024-01-01,2024-01-31`) **ou** body POST `/search` si trop long.
- Recommandation V1 : **GET avec `filter` répétable** + `search` + `sort=field,dir` + `page` + `size` + `scope`.
- **URL front** : même état dans les query params route (deep-link).
- **Saved view** : JSON `ListingQueryState` (sans `page` ou avec `page=1` reset).

Compat : garder `ListQuery` actuel comme façade dépréciée / adapter vers `ListingQueryState`.

### 6.3 Réponse list

```ts
interface ListingPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

## 7. Front — Anatomy

### 7.1 `nf-listing-flat` devient stateful sur la query

Inputs / outputs :

| API | Rôle |
|---|---|
| `query` input (optional) | hydration contrôlée (URL / parent / saved view) |
| `queryChange` output | émet le nouvel état à chaque mutation |
| `items` | mode local (applique query client via util opérateurs) |
| `loader` / events remote | mode remote : parent ou facade charge avec la query |
| `loading` / `error` | déjà partiel — formaliser empty / error / retry |

Comportement :

- local : `matchesFilters` remplacé par évaluation d’opérateurs
- remote : **ne pas** refiltrer les `items` reçus ; pagination/total viennent du serveur
- tri branché sur `nf-data-table`
- `initialFilters` → déprécié au profit de `query.filters` / saved view

### 7.2 Filter UI

Un seul renderer (builder + pinned) doit couvrir :

`text | number | date | daterange | select | multiselect | boolean`

Opérateurs exposés par type (pas tous partout) :

| Type | Ops V1 |
|---|---|
| text | contains, eq, startsWith, isEmpty |
| number | eq, between, gt/lt |
| date | eq, between |
| daterange | between (UI native range) |
| select | eq |
| multiselect | in |
| boolean | eq |

Presets relatifs date (`last7d`, `thisMonth`) : V1.1.

### 7.3 Saved views (UI)

V1 perso seulement :

- liste des vues (nom)
- Save current / Update / Delete / Apply
- marqueur « dirty » si query ≠ vue active
- pas de partage

### 7.4 Convergence `entity-listing`

`entity-listing.buildQuery()` doit émettre / consommer `ListingQueryState`.  
À terme : `entity-listing` orchestre (facade + permissions) ; `listing-flat` rend.

## 8. Back — Framework query

### 8.1 Parser + Specification builder

Dans `core/framework` :

- `ListingQuery` DTO (miroir)
- `ListingQueryParser` (query params → DTO)
- `ListingSpecificationBuilder<T>` (DTO → JPA `Specification<T>`)
- allowlist de champs filtrables **par ressource** (sécurité : pas de path arbitraire)

### 8.2 `CrudController`

Étendre `GET /{basePath}` :

- conserver `search` / `sort` / `page` / `size`
- ajouter `filter` répétable + `scope`
- page index : **trancher** 0-back vs 1-front via adapter (Anatomy reste 1-indexed ; HTTP peut rester 0-indexed Spring)

### 8.3 Scope

| Scope | Impl |
|---|---|
| `all` | tenant only (déjà via repo / context) |
| `mine` | `createdBy = currentUserId` (nécessite champ sur `TenantEntity`) |
| `archived` | V2 (`deletedAt != null`) |

## 9. Saved views — persistance

### 9.1 Ressource platform

Table `listing_saved_views` (tenant-scoped, étend `TenantEntity`) :

| Colonne | Type |
|---|---|
| id | UUID |
| tenant_id | UUID |
| owner_user_id | UUID |
| resource_key | varchar (ex. `products`, `email-templates`) |
| name | varchar |
| is_default | bool |
| query_json | jsonb / text |
| created_at / updated_at | |

API :

- `GET /api/listing-views?resourceKey=`
- `POST /api/listing-views`
- `PUT /api/listing-views/{id}`
- `DELETE /api/listing-views/{id}`

V1 : owner = current user only.  
V2 : `visibility = private|shared`, `defaultByRole`.

## 10. Phases de livraison

### Phase A — Contrat + fondation (back + types front)

1. `PlatformEntity` / `TenantEntity`
2. Types TS `ListingQueryState` (+ déprécier flat `ListQuery` usage neuf)
3. Util client opérateurs (remplace égalité stricte)
4. Spec builder Java + allowlist sur 1 CRUD pilote

### Phase B — Listing flat query-native (front)

1. `query` / `queryChange` + tri
2. Filtres `multiselect` + `daterange` + ops
3. Hydration URL sur le sandbox `/archetypes/listing`
4. Mode remote opt-in (loader) sans casser le mode local demo

### Phase C — Saved views perso (front + back)

1. Table + API
2. UI overflow « Vues »
3. Apply / Save / Default perso

### Phase D — Convergence

1. `entity-listing` sur `ListingQueryState`
2. Export serveur = même query
3. (plus tard) shared views, scope archived, select-all-matching

## 11. Preuves / acceptance

Sandbox `listing` :

- [x] deep-link : reload URL restaure search/filters/sort/page
- [x] `multiselect` + `daterange` rendus et appliqués
- [x] op `contains` / `in` / `between` visibles dans le comportement
- [x] mode local inchangé pour le lab actuel
- [x] 1 endpoint CRUD framework accepte les mêmes filters
- [x] saved view perso : save → reload page → apply (localStorage sandbox ; API prête)
- [x] au moins 1 entité JPA extends `TenantEntity`

Hors scope preuve V1 : partage de vue, OR groups, soft-delete UI.

## 12. Risques

- **Diverger encore** filter-builder vs filter-bar vs pinned → unifier avant d’étendre.
- **Injection de path JPA** si filters sans allowlist → allowlist obligatoire.
- **Double pagination** (client + serveur) si remote mal branché → flag mode explicite.
- **Big-bang PlatformEntity** → migration progressive, entités pilotes d’abord.

## 13. Décisions ouvertes (à trancher avant code Phase B/C)

1. Transport filters : query-param répétable vs `POST /search` ?
2. `page` HTTP 0-indexed (Spring) avec adapter Anatomy 1-indexed — OK ?
3. `createdBy` obligatoire dès V1 de `TenantEntity` (recommandé pour scope `mine`) ?
4. Saved views : module framework dédié ou feature `collaboration` ?

## 14. Reco d’ordre

1. **PlatformEntity + ListingQueryState** (contrat)  
2. **Listing flat queryChange / opérateurs / types filtres**  
3. **CrudController filters** sur 1 pilote  
4. **Saved views perso**  
5. Convergence entity-listing / export / URL partout  

Sans (1), les filtres ERP restent du maquillage UI.
