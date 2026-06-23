# Wave 1 — Inventory

## Findings traités

D'après `migration_plan.md` §1 et `00-MOCK-INVENTORY.md` :

- Le module Inventory est le plus proche d'une intégration prête : 9 des `*-api.service.ts` sont déjà pure HTTP.
- **Mais** plus de 25 fichiers (pages, composants éditeurs de lignes, facades) injectent encore `InventoryMockService` ou `MaterielGmaoMockService` directement.
- Les composants `inventaire-lines-editor`, `perte-lines-editor`, `reception-lines-editor`, `retour-lines-editor`, `transfert-lines-editor` lisent les articles, dépôts, motifs de mouvement, lots depuis le mock — ils doivent passer par les lookups réels.
- Le suivi (`/inventory/suivi/etat-stock`, `valorisation`) lit la valorisation depuis le mock — il faut un endpoint backend dédié.
- Le module **Matériel** (engins, affectations, maintenance, carburant, locations, planning, pointage, contrôles) est presque entièrement dans `MaterielGmaoMockService` et `pages/inventory/materiel/**` — la roadmap Round 2 Task 05 prévoit de le sortir mais **côté backend rien n'existe**.

## Goal

Faire passer le module Inventory à **zéro mock**, avec un backend qui supporte :

1. Catalogue d'articles (déjà fait à 80% côté `item`).
2. Dépôts (warehouses) + emplacements.
3. Mouvements stock (réception / sortie / transfert / inventaire / perte / retour) avec lignes + transitions.
4. Réservations stock chantier (lien `chantierId`).
5. Magasin chantier digital (read model par chantier).
6. Référentiels matériel (engins) — V1 limitée à la fiche engin + affectations.
7. Endpoints `valorisation` et `etat-stock` au backend.

## Source-of-truth frontend

**Pure HTTP déjà câblés (à valider) :**

```
pages/inventory/catalogue/items/services/item-api.service.ts
pages/inventory/catalogue/item-prices/services/item-price-api.service.ts
pages/inventory/catalogue/articles/services/article-api.service.ts                    ← inject InventoryMockService → à nettoyer
pages/inventory/catalogue/materiel/services/materiel-api.service.ts                   ← inject MaterielGmaoMockService → à nettoyer
pages/inventory/configuration/item-categories/services/item-category-api.service.ts
pages/inventory/configuration/item-types/services/item-type-api.service.ts
pages/inventory/configuration/unit-of-measures/services/unit-of-measure-api.service.ts
pages/inventory/configuration/uo-mcategories/services/uo-mcategory-api.service.ts
pages/inventory/mouvements/inventory-txes/services/inventory-tx-api.service.ts
pages/inventory/mouvements/inventory-tx-lines/services/inventory-tx-line-api.service.ts
pages/inventory/suivi/stock-balances/services/stock-balance-api.service.ts
```

**Pages / composants à désinjecter (cf. `00-MOCK-INVENTORY.md` §2.8) :** 25+ fichiers.

## Cible backend

```
backend/domains/item/       (étendre — Article BTP, Materiel)
backend/domains/stock/      (étendre — Warehouse, StockMovement, StockReservation, Emplacement)
```

> **Décision :** on reste sur 2 domaines existants. On **n'éclate pas** en `inventory/`, `materiel/`, `magasin/` : le frontend ne le fait pas, le backend non plus.

### Entités à créer ou enrichir

| Domaine | Entité | Statut | Description |
|---|---|---|---|
| item | `Article` | NOUVEAU | Spécifique BTP : pose budget, famille, type, lot, péremption, ABC |
| item | `Materiel` | NOUVEAU | Engin/équipement (immat, marque, modèle, type CACES, capacité) |
| stock | `Warehouse` (Dépôt) | NOUVEAU | Dépôt central + dépôt typé CHANTIER (lien `chantier_id`) |
| stock | `Emplacement` | NOUVEAU | Allée-rack-niveau dans un dépôt |
| stock | `StockMovement` | NOUVEAU | Mouvement (RECEPTION/SORTIE/TRANSFERT/INVENTAIRE/PERTE/RETOUR) |
| stock | `StockMovementLine` | NOUVEAU | Ligne (article + qté + lot + emplacement) |
| stock | `StockReservation` | NOUVEAU | Réservation chantier (article × qté × chantier × dates) |
| stock | `LotStock` | NOUVEAU | Lot avec date péremption |
| stock | `MaterielAffectation` | NOUVEAU | Affectation engin → chantier (avec dates) |
| stock | `StockBalance` (view ou table) | ENRICHIR | Stock courant par article × dépôt × lot |

## Tasks

### B-INV-01 — Articles BTP + désinjection `InventoryMockService` (CRUD)

**Goal :** étendre l'entité `Item` existante avec les champs spécifiques BTP (ou créer `Article` selon décision) et désinjecter le mock des pages `catalogue/articles`.

**Décision :** étendre `Item` plutôt que dupliquer en `Article` (les modèles frontend `Article` et `Item` sont déjà compatibles).

**À faire :**

1. Ajouter les champs manquants à l'entité `Item` : `posteBudgetId`, `familleArticleId`, `isPerissable`, `emplacementParDefautId`, `abcClass`, `prixMoyenPondere`.
2. Migration Liquibase `02-extend-items.xml`.
3. Endpoints custom :
   - `POST /api/v1/items/{id}/recalc-pmp` — recalcul prix moyen pondéré
4. Désinjecter `InventoryMockService` de :
   - `pages/inventory/catalogue/articles/services/article-api.service.ts`
   - `pages/inventory/catalogue/articles/services/article.facade.ts`
   - les 5 components éditeurs de lignes.

**Acceptance criteria :**

- [ ] `GET /api/v1/items` renvoie tous les articles avec les champs BTP.
- [ ] La page `/inventory/catalogue/articles` charge sur des données réelles.
- [ ] `grep -r "InventoryMockService" pages/inventory/catalogue/` → vide.

**Effort :** 2-3 j.h

---

### B-INV-02 — Dépôts (warehouses)

**Goal :** entité `Warehouse` (dépôt) avec typage CENTRAL/CHANTIER/TRANSIT.

**À créer :**

```
backend/domains/stock/src/main/java/ma/nafura/stock/domain/model/Warehouse.java
backend/domains/stock/src/main/java/ma/nafura/stock/api/controller/{base/,}WarehouseController{,Base}.java
backend/domains/stock/src/main/java/ma/nafura/stock/api/request/Warehouse{Create,Update}Dto.java
backend/domains/stock/src/main/java/ma/nafura/stock/mapper/WarehouseMapper.java
backend/domains/stock/src/main/java/ma/nafura/stock/repository/WarehouseRepository.java
backend/domains/stock/src/main/java/ma/nafura/stock/service/{base/WarehouseServiceBase.java, WarehouseService.java}
backend/domains/stock/src/main/resources/db/changelog/schema/v1.0/02-create-warehouses.xml
```

**Champs `Warehouse` :**

```
id, tenant_id, code, name, type (CENTRAL/CHANTIER/TRANSIT), chantier_id (nullable),
address, manager_user_id, is_active, created_at, updated_at
```

**Acceptance criteria :**

- [ ] CRUD complet via socle.
- [ ] Filtrage par `type` et `chantier_id` via query params.
- [ ] La page `/inventory/configuration/depots` consomme `WarehouseFacade` qui consomme `/api/v1/warehouses`.

**Effort :** 1-2 j.h

---

### B-INV-03 — Stock balances (lookup + agrégat)

**Goal :** vue/table matérialisée du stock courant par article × dépôt × lot.

**Choix d'implémentation :**

V1 = vue PostgreSQL `stock_balances_view` calculée à partir de `stock_movement_lines`.
V2 = table dénormalisée mise à jour par trigger après validation mouvement (perf).

**Endpoints :**

```
GET /api/v1/stock-balances?warehouseId=...&itemId=...&page=0&size=20
GET /api/v1/stock-balances/lookup
GET /api/v1/stock-balances/aggregate-by-item?itemIds=id1,id2
```

**Acceptance criteria :**

- [ ] Frontend `pages/inventory/suivi/stock-balances` charge en HTTP réel.
- [ ] Total stock par article = somme des mouvements VALIDES.

**Effort :** 1-2 j.h

---

### B-INV-04 — Mouvements stock + transition VALIDER

**Goal :** entités `StockMovement` + `StockMovementLine` avec workflow.

**Workflow :**

```
BROUILLON ── /submit ──► SOUMIS ── /validate ──► VALIDE (impacte stock_balances)
                                       └ /cancel ──► ANNULE
```

**Endpoints custom :**

```
POST /api/v1/stock-movements/{id}/submit
POST /api/v1/stock-movements/{id}/validate
POST /api/v1/stock-movements/{id}/cancel
```

**Désinjection mock :**

- `pages/inventory/mouvements/inventory-txes/services/inventory-tx.facade.ts`
- `pages/inventory/mouvements/sorties/services/sortie.facade.ts`
- 5 components `*-lines-editor` (réception, sortie, transfert, inventaire, perte, retour).

**Acceptance criteria :**

- [ ] `POST /api/v1/stock-movements` crée un mouvement BROUILLON avec lignes.
- [ ] `POST /…/validate` change le statut + met à jour `stock_balances`.
- [ ] Frontend `pages/inventory/mouvements/*` n'injecte plus `InventoryMockService`.

**Effort :** 3-4 j.h

---

### B-INV-05 — Réservations stock chantier

**Goal :** entité `StockReservation` qui décrémente la dispo apparente (`Disponible = Stock - Réservations actives`).

**Endpoints :**

```
GET    /api/v1/stock-reservations?chantierId=...&status=ACTIVE
POST   /api/v1/stock-reservations
DELETE /api/v1/stock-reservations/{id}
POST   /api/v1/stock-reservations/{id}/release   ← libération manuelle
```

**Logique custom :**

- Auto-libération à `dateExpiration` (job Spring `@Scheduled`).
- Sortie de stock (`StockMovement` type SORTIE) consomme les réservations FIFO du même chantier.

**Désinjection mock :** `pages/inventory/reservations/**` + `magasin-chantier.page.ts`.

**Effort :** 1-2 j.h

---

### B-INV-06 — Magasin chantier digital (read model)

**Goal :** endpoint d'agrégat `/api/v1/chantiers/{id}/magasin` qui renvoie stock + mouvements + valorisation pour 1 chantier.

**Endpoint :**

```
GET /api/v1/chantiers/{id}/magasin
→ {
    chantierId, chantierLabel, depotChantierId,
    stockArticles: [{ itemId, label, qte, valorisation }],
    derniersMouvements: [...],
    totalValorisation
  }
```

> **Note :** cet endpoint vit dans `backend/domains/stock` (pas dans `chantiers`), parce que la donnée source est le stock. La route est `/api/v1/chantiers/...` pour respecter la lisibilité côté frontend.

**Désinjection mock :** `pages/inventory/magasin-chantier/magasin-chantier.page.ts`.

**Effort :** 1-2 j.h

---

### B-INV-07 — Matériel & équipements (V1)

**Goal :** entité `Materiel` + `MaterielAffectation` pour le module Parc.

**V1 limité à :**

- Fiche engin (CRUD)
- Affectations chantier (CRUD + transitions ACTIVE/CLOSE)

**V1 exclut (reporté Wave 5 ou backlog) :**

- Maintenance préventive, carburant, contrôles réglementaires, planning Gantt, pointage engin → ces pages restent en mode "redirect /parc" ou "stub" comme dans Round 2 Task 05.

**Désinjection mock :** `pages/inventory/catalogue/materiel/**` + `MaterielGmaoMockService` quarantiné.

**Effort :** 1-2 j.h

## Frontend cleanup

À la fin de la Wave 1 Inventory :

```bash
grep -rE "inject\((InventoryMockService|MaterielGmaoMockService)\)" \
  web/app/applications/erp/inventory/ \
  web/app/applications/erp/pages/inventory/ \
  2>/dev/null
# (vide attendu)
```

## Testing

| Test | Type | Périmètre |
|---|---|---|
| `WarehouseServiceTest` | JUnit | CRUD + filtres |
| `StockMovementServiceTest` | JUnit | transitions BROUILLON → VALIDE + impact balances |
| `StockReservationServiceTest` | JUnit | FIFO + auto-libération |
| `MagasinChantierControllerTest` | `@WebMvcTest` | agrégat |
| `inventory-flow.e2e.spec.ts` | Playwright | Création article → réception → sortie → balance |

## Dependencies

- **Wave 0 complete** (item / stock / currency stables, partner disponible si articles ont fournisseur catalog).
- Aucune dépendance Achats/Ventes/Chantiers — ce module est indépendant en lecture.

## Definition of Done — Inventory

- [ ] B-INV-01 → B-INV-07 toutes `[x]`
- [ ] `grep MockService` sur dossier inventory → vide
- [ ] Les 25+ fichiers listés dans `00-MOCK-INVENTORY.md` §2.8 ne référencent plus de mock
- [ ] `InventoryMockService` et `MaterielGmaoMockService` quarantinés (marqués `@deprecated`)
- [ ] `00-PROGRESS.md` à jour
